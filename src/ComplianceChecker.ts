import { injectable, inject } from "tsyringe";
import { checkHumanName as humanCheckName, Rule, RuleCheck, ruleHumanName as humanRuleName } from "./Rule";
import { AssertionError } from "assert";
import './rules';
import { ProductService } from "./services/ProductService";
import Chalk from 'chalk';

const RESULT_PASS = Chalk.green('✓');
const RESULT_ERROR = Chalk.red('!');
const RESULT_FAIL = Chalk.red('✗');

@injectable()
export class ComplianceChecker {

    constructor(
        @inject('rules') private readonly rules: Rule[],
        private readonly productService: ProductService
    ) {
        this.rules = rules;
        this.productService = productService;
    }

    async main() {
        const doRepair = process.env.INPUT_REPAIR == 'true';
        const product = await this.productService.loadProduct();

        let passing = true;
        for(const rule of this.rules) {
            const humanRuleNameVal = humanRuleName(rule);
            console.log(`\n${humanRuleNameVal}`);

            for(const [checkName, checkFunc] of this.listChecks(rule)) {
                const humanCheckNameVal = humanCheckName(checkName).toLowerCase();
                const fixFunc = Reflect.get(rule, checkName.replace('check', 'fix'));
                let outcome = RESULT_PASS;
                let message = null;

                try {
                    await checkFunc.call(rule, product);
                } catch (error) {
                    if (error instanceof AssertionError) {
                        if (doRepair && fixFunc) {
                            try {
                                await fixFunc.call(rule, product);
                            } catch (repairError) {
                                outcome = RESULT_FAIL;
                                message = `${error.message} and repair failed with ${repairError}`;
                            }
                        } else {
                            outcome = RESULT_FAIL;
                            message = error.message;
                        }
                    } else {
                        outcome = RESULT_ERROR;
                        message = `${humanCheckNameVal}: ${error.message}`;
                    }
                }

                console.log(`${outcome} ${message || humanCheckNameVal}`);
                passing &&= (outcome == RESULT_PASS);
            }
        }

        console.log(`\nResult: ${Chalk.inverse(passing ? Chalk.green('PASS') : Chalk.red('FAIL'))}`);
        if (!passing && doRepair) {
            console.log('trilogy-eng-standards needs admin access on your repository to fix most issues');
        }
        console.log('');
        process.exitCode = passing ? 0 : 1;
    }

    listChecks(rule: any): Map<string,RuleCheck> {
        // there must be a better way to check if a function matches a type signature
        const pairs = Object.keys(rule.__proto__)
            .filter(checkName => checkName.startsWith('check') && checkName != 'check')
            .map((checkName): [string, RuleCheck] => [checkName, rule[checkName]]);
        return new Map(pairs);
    }

}

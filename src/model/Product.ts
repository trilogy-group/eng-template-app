import assert from "assert";

import { BranchProtection, Repo } from "./Repo";

export class Product {

    readonly name;
    repo!: Repo;

    constructor(
    ) {
        this.name = process.env.INPUT_PRODUCT_NAME ?? 'unknown';
    }

    public get mainProtection(): BranchProtection {
        assert(this.repo.mainBranch, 'a main branch must exist');
        assert(this.repo.mainBranch.protection, 'main branch must be protected');
        return this.repo.mainBranch.protection
    }

    toString(): string {
        return this.repo.id || 'new product';
    }

}

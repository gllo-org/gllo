ALTER TABLE transactions
    DROP CONSTRAINT IF EXISTS transactions_account_id_fkey,
    DROP CONSTRAINT IF EXISTS transactions_category_id_fkey,
    DROP CONSTRAINT IF EXISTS transactions_trip_id_fkey;

ALTER TABLE transactions
    ADD CONSTRAINT transactions_account_id_fkey
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    ADD CONSTRAINT transactions_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    ADD CONSTRAINT transactions_trip_id_fkey
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL;

ALTER TABLE recurring_rules
    DROP CONSTRAINT IF EXISTS recurring_rules_account_id_fkey,
    DROP CONSTRAINT IF EXISTS recurring_rules_category_id_fkey;

ALTER TABLE recurring_rules
    ADD CONSTRAINT recurring_rules_account_id_fkey
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    ADD CONSTRAINT recurring_rules_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

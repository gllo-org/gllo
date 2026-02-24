ALTER TABLE user_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips           ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_self" ON user_profiles
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "accounts_self" ON accounts
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "categories_read" ON categories FOR SELECT
    USING (user_id IS NULL OR (SELECT auth.uid()) = user_id);

CREATE POLICY "categories_write" ON categories FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id AND system_category = FALSE);

CREATE POLICY "categories_update" ON categories FOR UPDATE
    USING ((SELECT auth.uid()) = user_id AND system_category = FALSE);

CREATE POLICY "categories_delete" ON categories FOR DELETE
    USING ((SELECT auth.uid()) = user_id AND system_category = FALSE);

CREATE POLICY "exchange_rates_read" ON exchange_rates FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "trips_self" ON trips
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "transactions_self" ON transactions
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "budgets_self" ON monthly_budgets
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "recurring_rules_self" ON recurring_rules
    USING ((SELECT auth.uid()) = user_id);

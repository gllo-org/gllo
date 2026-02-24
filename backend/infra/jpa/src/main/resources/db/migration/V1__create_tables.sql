CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE user_profiles (
    id                   BIGSERIAL                    PRIMARY KEY,
    user_id              UUID                         NOT NULL UNIQUE,
    email                VARCHAR(255)                 NOT NULL,
    display_name         VARCHAR(50)                  NOT NULL,
    profile_image_url    VARCHAR(500),
    purpose              VARCHAR(30)                  CHECK (purpose IN ('EXCHANGE_STUDENT', 'IMMIGRATION', 'WORKING_HOLIDAY', 'LONG_TERM_TRAVEL')),
    country              VARCHAR(100),
    stay_start_date      DATE,
    stay_end_date        DATE,
    onboarding_completed BOOLEAN                      NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP WITHOUT TIME ZONE  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP WITHOUT TIME ZONE  NOT NULL DEFAULT NOW(),
    deleted_at           TIMESTAMP WITHOUT TIME ZONE
);

CREATE UNIQUE INDEX idx_user_profile_user_id ON user_profiles(user_id);

CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE accounts (
    id           BIGSERIAL      PRIMARY KEY,
    user_id      UUID           NOT NULL,
    name         VARCHAR(100)   NOT NULL,
    type         VARCHAR(10)    NOT NULL,
    currency     VARCHAR(3)     NOT NULL CHECK (currency IN ('EUR', 'USD', 'GBP', 'KRW')),
    balance      NUMERIC(19, 4) NOT NULL DEFAULT 0,
    average_rate NUMERIC(19, 6) NOT NULL DEFAULT 0,
    created_at   TIMESTAMP WITHOUT TIME ZONE  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);

CREATE TABLE categories (
    id              BIGSERIAL   PRIMARY KEY,
    user_id         UUID,
    name            VARCHAR(30) NOT NULL,
    type            VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    system_category BOOLEAN     NOT NULL DEFAULT FALSE,
    color           VARCHAR(20),
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

CREATE TABLE exchange_rates (
    id              BIGSERIAL      PRIMARY KEY,
    base_currency   VARCHAR(3)     NOT NULL,
    target_currency VARCHAR(3)     NOT NULL,
    rate            NUMERIC(19, 6) NOT NULL,
    rate_date       DATE           NOT NULL,
    created_at      TIMESTAMP WITHOUT TIME ZONE  NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_exchange_rate_pair_date UNIQUE (base_currency, target_currency, rate_date)
);

CREATE INDEX idx_exchange_rates_pair ON exchange_rates(base_currency, target_currency);
CREATE INDEX idx_exchange_rates_date ON exchange_rates(rate_date DESC);

CREATE TABLE trips (
    id              BIGSERIAL      PRIMARY KEY,
    user_id         UUID           NOT NULL,
    name            VARCHAR(100)   NOT NULL,
    start_date      DATE           NOT NULL,
    end_date        DATE,
    budget          NUMERIC(19, 4),
    budget_currency VARCHAR(3),
    active          BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITHOUT TIME ZONE  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trips_user_id ON trips(user_id);

CREATE TABLE transactions (
    id                      BIGSERIAL      PRIMARY KEY,
    user_id                 UUID           NOT NULL,
    account_id              BIGINT         NOT NULL REFERENCES accounts(id),
    type                    VARCHAR(10)    NOT NULL CHECK (type IN ('EXPENSE', 'INCOME', 'EXCHANGE')),
    title                   VARCHAR(100)   NOT NULL,
    amount                  NUMERIC(19, 4) NOT NULL,
    currency                VARCHAR(3)     NOT NULL,
    category_id             BIGINT         REFERENCES categories(id),
    trip_id                 BIGINT         REFERENCES trips(id),
    transaction_date        DATE           NOT NULL,
    note                    VARCHAR(500),
    system_exchange_rate    NUMERIC(19, 4),
    custom_exchange_rate    NUMERIC(19, 4),
    custom_converted_amount NUMERIC(19, 4),
    created_at              TIMESTAMP WITHOUT TIME ZONE  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id    ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date       ON transactions(user_id, transaction_date DESC);

CREATE TABLE monthly_budgets (
    id         BIGSERIAL      PRIMARY KEY,
    user_id    UUID           NOT NULL,
    year_month VARCHAR(7)     NOT NULL,
    amount     NUMERIC(19, 4) NOT NULL,
    currency   VARCHAR(3)     NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE  NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_budget_user_yearmonth UNIQUE (user_id, year_month)
);

CREATE INDEX idx_budgets_user_id ON monthly_budgets(user_id);

CREATE TABLE recurring_rules (
    id                   BIGSERIAL      PRIMARY KEY,
    user_id              UUID           NOT NULL,
    name                 VARCHAR(100)   NOT NULL,
    title                VARCHAR(100)   NOT NULL,
    type                 VARCHAR(10)    NOT NULL CHECK (type IN ('EXPENSE', 'INCOME')),
    amount               NUMERIC(19, 4) NOT NULL,
    currency             VARCHAR(3)     NOT NULL,
    account_id           BIGINT         NOT NULL REFERENCES accounts(id),
    category_id          BIGINT         REFERENCES categories(id),
    frequency            VARCHAR(10)    NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
    day_of_month         INTEGER,
    start_date           DATE           NOT NULL,
    end_date             DATE,
    next_execution_date  DATE           NOT NULL,
    active               BOOLEAN        NOT NULL DEFAULT TRUE,
    notify_days_before   INTEGER,
    notification_message VARCHAR(200),
    created_at           TIMESTAMP WITHOUT TIME ZONE  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recurring_user_id   ON recurring_rules(user_id);
CREATE INDEX idx_recurring_next_exec ON recurring_rules(next_execution_date);

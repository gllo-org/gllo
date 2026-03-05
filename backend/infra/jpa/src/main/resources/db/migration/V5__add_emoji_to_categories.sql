ALTER TABLE categories ADD COLUMN emoji VARCHAR(10);

UPDATE categories SET emoji = '🍜' WHERE name = '식비' AND system_category = TRUE;
UPDATE categories SET emoji = '🚇' WHERE name = '교통' AND system_category = TRUE;
UPDATE categories SET emoji = '🏠' WHERE name = '주거' AND system_category = TRUE;
UPDATE categories SET emoji = '🛍️' WHERE name = '쇼핑' AND system_category = TRUE;
UPDATE categories SET emoji = '✈️' WHERE name = '여행' AND system_category = TRUE;
UPDATE categories SET emoji = '🏥' WHERE name = '의료' AND system_category = TRUE;
UPDATE categories SET emoji = '🎬' WHERE name = '엔터테인먼트' AND system_category = TRUE;
UPDATE categories SET emoji = '📚' WHERE name = '교육' AND system_category = TRUE;
UPDATE categories SET emoji = '💸' WHERE name = '기타지출' AND system_category = TRUE;
UPDATE categories SET emoji = '💼' WHERE name = '급여' AND system_category = TRUE;
UPDATE categories SET emoji = '💰' WHERE name = '용돈' AND system_category = TRUE;
UPDATE categories SET emoji = '💚' WHERE name = '기타수입' AND system_category = TRUE;
UPDATE categories SET emoji = '🎁' WHERE name = '상여금' AND system_category = TRUE;
UPDATE categories SET emoji = '🚌' WHERE name = '교통비' AND system_category = TRUE;
UPDATE categories SET emoji = '🏡' WHERE name = '주거비' AND system_category = TRUE;
UPDATE categories SET emoji = '📱' WHERE name = '통신비' AND system_category = TRUE;
UPDATE categories SET emoji = '🎭' WHERE name = '문화생활' AND system_category = TRUE;

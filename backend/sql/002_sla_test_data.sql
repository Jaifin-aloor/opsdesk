WITH test_cases AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM disputes
    WHERE status IN ('PENDING', 'MANUAL_REVIEW')
    ORDER BY id
    LIMIT 4
)
UPDATE disputes AS d
SET sla_deadline = CASE test_cases.rn
    WHEN 1 THEN NOW() - INTERVAL '1 hour'
    WHEN 2 THEN NOW() + INTERVAL '1 hour'
    WHEN 3 THEN NOW() + INTERVAL '6 hours'
    WHEN 4 THEN NOW() + INTERVAL '18 hours'
END
FROM test_cases
WHERE d.id = test_cases.id;
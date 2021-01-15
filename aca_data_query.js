function aca_data_query(opts) {
    const { ExternalsCount } = opts;
    const { YearId, GradeId, SemesterId, SDepartmentId, SAllDepartments } = opts;

    const regStuds_query =
        `WITH StudCounts AS (
    SELECT b.YearId, YearRecommId, EnrollmentTypeId, count(*) AS CNTS
    FROM GPAwRecomm AS g INNER JOIN BatchEnrollments AS b ON 
        (g.YearId = b.YearId AND g.GradeId = b.GradeId AND g.StudentId = b.StudentId AND g.DepartmentId = b.DepartmentId)
    WHERE (g.YearId <= ${YearId} AND g.YearId > (${YearId} - 3)) AND g.GradeId = ${GradeId} AND 
        g.DepartmentId = ${SDepartmentId} AND NOT (EnrollmentTypeId = 3)
    group by b.YearId, YearRecommId, EnrollmentTypeId
), XCnts AS (
    SELECT YearId, RecommendationTypes.Id AS RecId,
        RecommendationTypes.ShortNameEnglish AS Recommendation, CNTS, Pass
    FROM StudCounts
        INNER JOIN RecommendationTypes ON (RecommendationTypes.Id = StudCounts.YearRecommId)
), Zconts AS (
    SELECT YearId, 1 AS OC, SUM(CNTS) AS CNT FROM XCnts GROUP BY YearId
    UNION
    SELECT YearId, 2 AS OC, SUM(CNTS) AS CNT FROM XCnts WHERE NOT (RecId = 14) GROUP BY YearId
    UNION
    SELECT YearId, 3 AS OC, SUM(CNTS) AS CNT FROM XCnts WHERE Pass = 1 GROUP BY YearId
    UNION
    SELECT YearId, 4 AS OC, SUM(CNTS) AS CNT FROM XCnts WHERE RecId = 8 GROUP BY YearId
    UNION
    SELECT YearId, 5 AS OC, SUM(CNTS) AS CNT FROM XCnts WHERE RecId = 9 OR RecId = 18 GROUP BY YearId
    UNION
    SELECT YearId, 6 AS OC, SUM(CNTS) AS CNT FROM XCnts WHERE RecId = 10 GROUP BY YearId
    UNION
    SELECT YearId, 7 AS OC, SUM(CNTS) AS CNT FROM XCnts WHERE RecId = 6  OR RecId = 11 GROUP BY YearId
    UNION
    SELECT YearId, 8 AS OC, SUM(CNTS) AS CNT FROM XCnts WHERE RecId = 15 GROUP BY YearId
    UNION
    SELECT YearId, 9 AS OC, SUM(CNTS) AS CNT FROM XCnts WHERE RecId = 14 GROUP BY YearId
    UNION
    SELECT YearId, 10 AS OC, SUM(CNTS) AS CNT FROM XCnts WHERE RecId = 13 OR RecId = 19 GROUP BY YearId
    UNION
    SELECT YearId, 11 AS OC, SUM(CNTS) AS CNT FROM XCnts WHERE RecId = 20 GROUP BY YearId
), AlmostDone AS (
    SELECT OC, [${YearId}], [${YearId - 1}], [${YearId - 2}] 
    FROM Zconts 
    PIVOT (
        SUM(CNT)
        FOR YearId IN ([${YearId - 2}], [${YearId - 1}], [${YearId}])
    ) As Dst
) SELECT Nm, Label, [${YearId}], [${YearId - 1}], [${YearId - 2}]
FROM (
VALUES
    (1, N'العدد الكلي'), (2, N'الجالسون'), (3, N'النجاح'), (4, N'البدائل'), (5, N'ازالة الرسوب (الملاحق)'), 
    (6, N'البدائل وازالة الرسوب'), (7, N'اعادة العام'), (8, N'المفصولون'), (9, N'المجمدون'), 
    (10, N'حالات خاصة'), (11, N'حالات مخالفة لائحة الامتحانات')
) V(Nm, Label) LEFT JOIN AlmostDone ON (Nm = AlmostDone.OC)
`;

    const regHonors_query =
        `;WITH StudCounts AS (
    SELECT g.YearId, CumulativeRecommId, count(*) AS CNTS
    FROM GPAwRecomm AS g INNER JOIN RecommendationTypes ON (RecommendationTypes.Id = g.CumulativeRecommId)
    WHERE (g.YearId <= ${YearId} AND g.YearId > (${YearId} - 3)) AND g.GradeId = ${GradeId} AND 
    g.DepartmentId = ${SDepartmentId} AND Pass = 1 AND NOT (YearRecommId = 5 OR YearRecommId = 7)
    GROUP BY g.YearId, CumulativeRecommId
), Zcnts AS (
    SELECT CumulativeRecommId, [${YearId}], [${YearId - 1}], [${YearId - 2}]
    FROM StudCounts
    PIVOT (
        MAX(CNTS)
        FOR YearId IN ( [${YearId}], [${YearId - 1}], [${YearId - 2}])
    ) As Dst
) SELECT *
FROM (VALUES (1, N'مرتبة الشرف اللأولى'), (2, N'مرتبة الشرف الثانية - القسم الأول'), (3, N'مرتبة الشرف الثانية - القسم الثاني'), (4, N'مرتبة الشرف الثالثة')) V(Nm, Label) 
    LEFT JOIN Zcnts ON (V.Nm = Zcnts.CumulativeRecommId)
`;

    const extStuds_query =
        `;WITH ExtStudCounts AS (
    SELECT g.YearId, YearRecommId AS RecId, count(*) AS CNTS
    FROM GPAwRecomm AS g 
        INNER JOIN BatchEnrollments AS b ON 
        (g.YearId = b.YearId AND g.GradeId = b.GradeId AND g.StudentId = b.StudentId AND g.DepartmentId = b.DepartmentId)
    WHERE 
        (g.YearId <= ${YearId} AND g.YearId > (${YearId} - 3)) AND g.GradeId = ${GradeId} AND 
        g.DepartmentId = ${SDepartmentId} AND b.EnrollmentTypeId = 3
    GROUP BY g.YearId, YearRecommId
), Zconts AS (
    SELECT YearId, 1 AS OC, SUM(CNTS) AS CNT FROM ExtStudCounts GROUP BY YearId
    UNION
    SELECT YearId, 2 AS OC, SUM(CNTS) AS CNT FROM ExtStudCounts GROUP BY YearId
    UNION
    SELECT YearId, 3 AS OC, SUM(CNTS) AS CNT FROM ExtStudCounts WHERE RecId = 5 GROUP BY YearId
    UNION
    SELECT YearId, 4 AS OC, SUM(CNTS) AS CNT FROM ExtStudCounts WHERE RecId = 8 GROUP BY YearId
    UNION
    SELECT YearId, 5 AS OC, SUM(CNTS) AS CNT FROM ExtStudCounts WHERE RecId = 9 OR RecId = 18 GROUP BY YearId
    UNION
    SELECT YearId, 6 AS OC, SUM(CNTS) AS CNT FROM ExtStudCounts WHERE RecId = 10 GROUP BY YearId
    UNION
    SELECT YearId, 7 AS OC, SUM(CNTS) AS CNT FROM ExtStudCounts WHERE RecId = 7 GROUP BY YearId
    UNION
    SELECT YearId, 8 AS OC, SUM(CNTS) AS CNT FROM ExtStudCounts WHERE RecId = 13 OR RecId = 19 GROUP BY YearId
    UNION
    SELECT YearId, 9 AS OC, SUM(CNTS) AS CNT FROM ExtStudCounts WHERE RecId = 20 GROUP BY YearId
), AlmostDone AS (
    SELECT OC, [${YearId}], [${YearId - 1}], [${YearId - 2}]
    FROM Zconts 
    PIVOT (
        SUM(CNT)
        FOR YearId IN ([${YearId}], [${YearId - 1}], [${YearId - 2}])
    ) As Dst
) SELECT Nm, Label, [${YearId}], [${YearId - 1}], [${YearId - 2}]
FROM (
VALUES
    (1, N'العدد الكلي'),
    (2, N'الجالسون'),
    (3, N'النجاح'),
    (4, N'البدائل'),
    (5, N'ازالة الرسوب (الملاحق)'),
    (6, N'البدائل وازالة الرسوب'),
    (7, N'الراسبون'),
    (8, N'حالات خاصة'),
    (9, N'حالات مخالفة لائحة الامتحانات')
) V(Nm, Label) LEFT JOIN AlmostDone ON (Nm = AlmostDone.OC);
`;

    const extHonours_query =
        `;WITH StudCounts AS (
    SELECT g.YearId, CumulativeRecommId, count(*) AS CNTS
    FROM GPAwRecomm AS g 
        INNER JOIN BatchEnrollments AS b ON (g.YearId = b.YearId AND g.GradeId = b.GradeId AND g.StudentId = b.StudentId AND g.DepartmentId = b.DepartmentId)
        RIGHT JOIN RecommendationTypes ON (RecommendationTypes.Id = g.CumulativeRecommId)
    WHERE (g.YearId <= ${YearId} AND g.YearId > (${YearId} - 3)) AND g.GradeId = ${GradeId} AND 
    g.DepartmentId = ${SDepartmentId} AND EnrollmentTypeId = 3 AND Pass = 1
    GROUP BY g.YearId, CumulativeRecommId
),Xcnts AS (
    SELECT CumulativeRecommId, [${YearId}], [${YearId - 1}], [${YearId - 2}]
    FROM StudCounts
    PIVOT (
        MAX(CNTS)
        FOR YearId IN ([${YearId}], [${YearId - 1}], [${YearId - 2}])
    ) As Dst
) SELECT * FROM 
(VALUES (1, N'مرتبة الشرف اللأولى'), (2, N'مرتبة الشرف الثانية - القسم الأول'), (3, N'مرتبة الشرف الثانية - القسم الثاني'), (4, N'مرتبة الشرف الثالثة')) V(Nm, Label) 
LEFT JOIN Xcnts ON (V.Nm = Xcnts.CumulativeRecommId)
`;
    if (GradeId == 5 && ExternalsCount == 0) {
        return (regStuds_query + regHonors_query)
    } else if (GradeId == 5 && ExternalsCount > 0) {
        return (regStuds_query + regHonors_query + extStuds_query + extHonours_query)
    } else {
        return (regStuds_query + extStuds_query);
    }
}

module.exports = aca_data_query;
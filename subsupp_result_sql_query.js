function subsupp_result_sql_query(opts) {
    // console.log(opts);
    const { YearId, GradeId, SemesterId, SDepartmentId, SDisciplineId } = opts;
	const { crs_ids, crs_cws, crs_exs, crs_prs, crs_ecs, crs_tot } = opts;
	
	const weightGPAs = [1, 3, 6, 10, 15];
	var prevGrades = [];

	for (let  g = 1; g < GradeId; g++) prevGrades.push(g);
	var gpas_cols_n_1 = prevGrades.map((g) => {return `[${g}]`}).join(',');
	var gpas_columns = prevGrades.map((g) => {return `[${g}] AS [GPA${g}]`}).join(',');
	var cgpaFormula = prevGrades.map((g) => {return `${g}*GPA${g} + `}).join(' ')
	var openBrack = GradeId!=1 ? '(' : '';
	cgpaFormula = openBrack + cgpaFormula + `${GradeId==1 ? '(' : '' }${GradeId}*GPA) / ${weightGPAs[GradeId-1]}`;

	var prevGPAs = prevGrades.map((g) => {return `GPA${g}`}).join(', ')

	var cgpasTable_query = `, PGPAsList AS (
	SELECT ROW_NUMBER() OVER (PARTITION BY StudentId, GradeId ORDER BY YearId DESC, Turn DESC) AS RNo, *
	FROM (
		SELECT *, 1 As Turn FROM GPAwRecomm WHERE StudentId IN (SELECT StudentId FROM SList)
		UNION
		SELECT *, 2 As Turn FROM SubSuppGPAwRecomm WHERE StudentId IN (SELECT StudentId FROM SList)
	) AS Src
), GPAsTable AS (
	SELECT StudentId, ${gpas_columns}
	FROM (
		SELECT StudentId, GradeId, GPA FROM PGPAsList
	) As Src PIVOT (
		MAX(GPA)
		FOR GradeId IN (${gpas_cols_n_1})
	) As PivDest
)`

    const qry = `WITH CList AS (
	SELECT OC.CourseId, CourseCode, TitleEnglish, CreditHours, CourseworkFraction, ExamFraction
	FROM CourseDisciplines AS CD 
		INNER JOIN OfferedCourses AS OC ON (CD.YearId = OC.YearId AND CD.GradeId = OC.GradeId AND OC.SemesterId = CD.SemesterId AND CD.CourseId = OC.CourseId)
		INNER JOIN Courses ON (OC.CourseId = Courses.Id)
	WHERE CD.YearId = ${YearId} AND CD.GradeId = ${GradeId} AND CD.SemesterId <= ${SemesterId} AND DisciplineId = ${SDisciplineId}
), SBSList AS (
    SELECT DISTINCT StudentId	
	FROM SubSuppMarksExamCW
	WHERE YearId = ${YearId} AND GradeId = ${GradeId} AND DepartmentId = ${SDepartmentId}
), SList AS (
	SELECT S.StudentId, [Index], [UnivNo], Students.NameArabic, EnrollmentTypes.NameEnglish As Enrollment
	FROM SemesterBatchEnrollments AS S
		INNER JOIN BatchEnrollments AS B 
			ON (S.YearId = B.YearId AND S.GradeId = B.GradeId AND S.DepartmentId = B.DepartmentId AND S.StudentId = B.StudentId)
		INNER JOIN Students ON (S.StudentId = Students.Id)
		INNER JOIN EnrollmentTypes ON (EnrollmentTypes.Id = B.EnrollmentTypeId)
	WHERE S.YearId = ${YearId} AND S.GradeId = ${GradeId} AND S.DepartmentId = ${SDepartmentId} AND 
		S.DisciplineId = ${SDisciplineId} AND S.SemesterId = ${SemesterId} AND S.StudentId IN (SELECT StudentId FROM SBSList)
), MarksList AS (
	SELECT StudentId, CourseId, CWMark, ExamMark, (COALESCE(CWMark,0) + ExamMark) As Total, CAST(Present AS INT) AS PR, CAST(Excuse AS INT) AS Exc
	FROM MarksExamCW
	WHERE YearId = ${YearId} AND GradeId = ${GradeId} AND DepartmentId = ${SDepartmentId} AND StudentId IN (SELECT StudentId FROM SList)
), SubMarksList AS (
	SELECT S.StudentId, S.CourseId, S.CWMark, S.ExamMark, (COALESCE(S.CWMark,0) + S.ExamMark) As Total, 
        CAST(S.Present AS INT) AS PR, CAST(S.Excuse AS INT) AS Exc
    FROM SubSuppMarksExamCW AS S INNER JOIN MarksExamCW AS M ON (S.YearId = M.YearId AND S.GradeId = M.GradeId AND S.SemesterId = M.SemesterId AND
        S.StudentId = M.StudentId AND S.CourseId = M.CourseId AND S.DepartmentId = M.DepartmentId)
        WHERE S.YearId = ${YearId} AND S.GradeId = ${GradeId} AND S.DepartmentId = ${SDepartmentId} AND S.StudentId IN (SELECT StudentId FROM SList) AND 
        (M.Present=0 AND (M.Excuse Is NULL OR M.Excuse = 1))
), SuppMarksList AS (
    SELECT S.StudentId, S.CourseId, S.CWMark, S.ExamMark, (COALESCE(S.CWMark,0) + S.ExamMark) As Total, 
        CAST(S.Present AS INT) AS PR, CAST(S.Excuse AS INT) AS Exc
    FROM SubSuppMarksExamCW AS S INNER JOIN MarksExamCW AS M ON (S.YearId = M.YearId AND S.GradeId = M.GradeId AND S.SemesterId = M.SemesterId AND
        S.StudentId = M.StudentId AND S.CourseId = M.CourseId AND S.DepartmentId = M.DepartmentId)
    WHERE S.YearId = ${YearId} AND S.GradeId = ${GradeId} AND S.DepartmentId = ${SDepartmentId} AND S.StudentId IN (SELECT StudentId FROM SList) AND 
        NOT (M.Present=0 AND (M.Excuse Is NULL OR M.Excuse = 1))
), GPAsList AS (
	SELECT StudentId, SUM(MarksList.Total*CreditHours) / (10 * SUM(CreditHours)) AS GPA, SUM(CASE 
		WHEN (PR = 0) AND (Exc = 0) AND (ExamMark Is NULL) THEN 0
		WHEN (PR = 0) AND (Exc = 1) AND (ExamMark Is NULL) THEN 1
		WHEN (PR = 0) AND (Exc IS NULL) AND (ExamMark Is NULL) THEN 1
		WHEN (PR = 1) AND NOT (ExamMark IS NULL) THEN 0
		ELSE 1
		END) AS ABCount
	FROM MarksList INNER JOIN CList ON (MarksList.CourseId = CList.CourseId)
	GROUP BY StudentId
), SubGPAsList AS (
	SELECT StudentId, SUM(Src.Total*CreditHours) / (10 * SUM(CreditHours)) AS GPA, SUM(CASE 
		WHEN (PR = 0) AND (Exc = 0) AND (ExamMark Is NULL) THEN 0
		WHEN (PR = 0) AND (Exc = 1) AND (ExamMark Is NULL) THEN 1
		WHEN (PR = 0) AND (Exc IS NULL) AND (ExamMark Is NULL) THEN 1
		WHEN (PR = 1) AND NOT (ExamMark IS NULL) THEN 0
		ELSE 1
		END) AS ABCount
	FROM  (
        (SELECT * FROM MarksList WHERE PR = 1 OR (PR=0 AND Exc = 0)
        UNION
        SELECT * FROM SubMarksList) As Src INNER JOIN CList ON (Src.CourseId = CList.CourseId)
    )
	GROUP BY StudentId
), SuppGPAsList AS (
	SELECT StudentId, SUM(Src.Total*CreditHours) / (10 * SUM(CreditHours)) AS GPA, SUM(CASE 
		WHEN (PR = 0) AND (Exc = 0) AND (ExamMark Is NULL) THEN 0
		WHEN (PR = 0) AND (Exc = 1) AND (ExamMark Is NULL) THEN 1
		WHEN (PR = 0) AND (Exc IS NULL) AND (ExamMark Is NULL) THEN 1
		WHEN (PR = 1) AND NOT (ExamMark IS NULL) THEN 0
		ELSE 1
		END) AS ABCount
	FROM  (
        (SELECT * FROM MarksList WHERE PR = 1 OR (PR=0 AND Exc = 0)
        UNION
        SELECT * FROM SubMarksList
        UNION
        SELECT * FROM SuppMarksList) As Src INNER JOIN CList ON (Src.CourseId = CList.CourseId)
    )
	GROUP BY StudentId
), EXTable AS (
	SELECT StudentId, ${crs_exs}
	FROM (SELECT StudentId, CourseId, ExamMark FROM MarksList) As CWPiv
	PIVOT (MAX(ExamMark) FOR CourseId IN (${crs_ids})) As PivDest1
), CWTable AS (
	SELECT StudentId, ${crs_cws}
	FROM (SELECT StudentId, CourseId, CWMark FROM MarksList) As CWPiv
	PIVOT (MAX(CWMark) FOR CourseId IN (${crs_ids})) As PivDest1
), PTable AS (
	SELECT StudentId, ${crs_prs}
	FROM (SELECT StudentId, CourseId, PR FROM MarksList) As CWPiv
	PIVOT (MAX(PR) FOR CourseId IN (${crs_ids})) As PivDest1
), ETable AS (
	SELECT StudentId, ${crs_ecs}
	FROM (SELECT StudentId, CourseId, Exc FROM MarksList) As CWPiv
	PIVOT (MAX(Exc) FOR CourseId IN (${crs_ids})) As PivDest1
), SubEXTable AS (
	SELECT StudentId, ${crs_exs}
	FROM (SELECT StudentId, CourseId, ExamMark FROM SubMarksList) As CWPiv
	PIVOT (MAX(ExamMark) FOR CourseId IN (${crs_ids})) As PivDest1
), SubCWTable AS (
	SELECT StudentId, ${crs_cws}
	FROM (SELECT StudentId, CourseId, CWMark FROM SubMarksList) As CWPiv
	PIVOT (MAX(CWMark) FOR CourseId IN (${crs_ids})) As PivDest1
), SubPTable AS (
	SELECT StudentId, ${crs_prs}
	FROM (SELECT StudentId, CourseId, PR FROM SubMarksList) As CWPiv
	PIVOT (MAX(PR) FOR CourseId IN (${crs_ids})) As PivDest1
), SubETable AS (
	SELECT StudentId, ${crs_ecs}
	FROM (SELECT StudentId, CourseId, Exc FROM SubMarksList) As CWPiv
	PIVOT (MAX(Exc) FOR CourseId IN (${crs_ids})) As PivDest1
), SuppEXTable AS (
	SELECT StudentId, ${crs_exs}
	FROM (SELECT StudentId, CourseId, ExamMark FROM SuppMarksList) As CWPiv
	PIVOT (MAX(ExamMark) FOR CourseId IN (${crs_ids})) As PivDest1
), SuppCWTable AS (
	SELECT StudentId, ${crs_cws}
	FROM (SELECT StudentId, CourseId, CWMark FROM SuppMarksList) As CWPiv
	PIVOT (MAX(CWMark) FOR CourseId IN (${crs_ids})) As PivDest1
), SuppPTable AS (
	SELECT StudentId, ${crs_prs}
	FROM (SELECT StudentId, CourseId, PR FROM SuppMarksList) As CWPiv
	PIVOT (MAX(PR) FOR CourseId IN (${crs_ids})) As PivDest1
), SuppETable AS (
	SELECT StudentId, ${crs_ecs}
	FROM (SELECT StudentId, CourseId, Exc FROM SuppMarksList) As CWPiv
	PIVOT (MAX(Exc) FOR CourseId IN (${crs_ids})) As PivDest1
) ${(GradeId > 1) ? cgpasTable_query : ''}
SELECT * FROM (
SELECT 1 AS Turn, SList.StudentId, SList.[Index], SList.UnivNo, SList.NameArabic, Enrollment,
	${crs_tot}, 
	ABCount, (CASE WHEN ABCount = 0 THEN GPA ELSE NULL END) AS GPA, ${(GradeId > 1) ? prevGPAs + ',' : ' '} 
	(CASE WHEN ABCount = 0 THEN ${cgpaFormula} ELSE NULL END) AS CGPA
FROM 
	SList 
	INNER JOIN EXTable ON (SList.StudentId = EXTable.StudentId) 
	INNER JOIN CWTable ON (SList.StudentId = CWTable.StudentId)
	INNER JOIN PTable ON (SList.StudentId = PTable.StudentId)
	INNER JOIN ETable ON (SList.StudentId = ETable.StudentId)
	INNER JOIN GPAsList ON (SList.StudentId = GPAsList.StudentId)
    ${GradeId > 1 ? 'INNER JOIN GPAsTable ON (SList.StudentId = GPAsTable.StudentId)': ''}
UNION
SELECT 2 AS Turn, SList.StudentId, SList.[Index], SList.UnivNo, SList.NameArabic, Enrollment,
	${crs_tot}, 
	ABCount, (CASE WHEN ABCount = 0 THEN GPA ELSE NULL END) AS GPA, ${(GradeId > 1) ? prevGPAs + ',' : ' '} 
	(CASE WHEN ABCount = 0 THEN ${cgpaFormula} ELSE NULL END) AS CGPA
FROM 
	SList 
	INNER JOIN SubEXTable ON (SList.StudentId = SubEXTable.StudentId) 
	INNER JOIN SubCWTable ON (SList.StudentId = SubCWTable.StudentId)
	INNER JOIN SubPTable ON (SList.StudentId = SubPTable.StudentId)
	INNER JOIN SubETable ON (SList.StudentId = SubETable.StudentId)
	INNER JOIN SubGPAsList ON (SList.StudentId = SubGPAsList.StudentId)
    ${GradeId > 1 ? 'INNER JOIN GPAsTable ON (SList.StudentId = GPAsTable.StudentId)': ''}
UNION
SELECT 3 AS Turn, SList.StudentId, SList.[Index], SList.UnivNo, SList.NameArabic, Enrollment,
	${crs_tot}, 
	ABCount, (CASE WHEN ABCount = 0 THEN GPA ELSE NULL END) AS GPA, ${(GradeId > 1) ? prevGPAs + ',' : ' '} 
	(CASE WHEN ABCount = 0 THEN ${cgpaFormula} ELSE NULL END) AS CGPA
FROM 
	SList 
	INNER JOIN SuppEXTable ON (SList.StudentId = SuppEXTable.StudentId) 
	INNER JOIN SuppCWTable ON (SList.StudentId = SuppCWTable.StudentId)
	INNER JOIN SuppPTable ON (SList.StudentId = SuppPTable.StudentId)
	INNER JOIN SuppETable ON (SList.StudentId = SuppETable.StudentId)
	INNER JOIN SuppGPAsList ON (SList.StudentId = SuppGPAsList.StudentId)
	${GradeId > 1 ? 'INNER JOIN GPAsTable ON (SList.StudentId = GPAsTable.StudentId)': ''}
) As Src ORDER BY dbo.fn_IndexOrder(Src.[Index], ${SDepartmentId}), Turn`;
    return qry;
};
module.exports = subsupp_result_sql_query;
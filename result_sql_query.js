function result_sql_query(opts) {
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

	// console.log(gpas_cols_n_1)
	// console.log(gpas_columns)
	// console.log(cgpaFormula)
	// process.exit()
	
    const qry = `WITH CList AS (
	SELECT OC.CourseId, CourseCode, TitleEnglish, CreditHours, CourseworkFraction, ExamFraction
	FROM CourseDisciplines AS CD 
		INNER JOIN OfferedCourses AS OC ON (CD.YearId = OC.YearId AND CD.GradeId = OC.GradeId AND OC.SemesterId = CD.SemesterId AND CD.CourseId = OC.CourseId)
		INNER JOIN Courses ON (OC.CourseId = Courses.Id)
	WHERE CD.YearId = ${YearId} AND CD.GradeId = ${GradeId} AND CD.SemesterId <= ${SemesterId} AND DisciplineId = ${SDisciplineId}
), SList AS (
	SELECT StudentId, [Index], [UnivNo], NameArabic
	FROM 
		BatchEnrollments LEFT JOIN Students ON (BatchEnrollments.StudentId = Students.Id)
	WHERE YearId = ${YearId} AND GradeId = ${GradeId} AND DepartmentId = ${SDepartmentId}
), MarksList AS (
	SELECT StudentId, CourseId, CWMark, ExamMark, (COALESCE(CWMark,0) + ExamMark) As Total, CAST(Present AS INT) AS PR, CAST(Excuse AS INT) AS Exc
	FROM MarksExamCW
	WHERE YearId = ${YearId} AND GradeId = ${GradeId} AND DepartmentId = ${SDepartmentId}
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
), EXTable AS (
	SELECT 
		StudentId, 
		${crs_exs}
	FROM (
		SELECT StudentId, CourseId, ExamMark FROM MarksList
	) As CWPiv
	PIVOT (
		MAX(ExamMark) 
		FOR CourseId IN (${crs_ids})
	) As PivDest1
), CWTable AS (
	SELECT 
		StudentId, 
		${crs_cws}
	FROM (
		SELECT StudentId, CourseId, CWMark FROM MarksList
	) As CWPiv
	PIVOT (
		MAX(CWMark) 
		FOR CourseId IN (${crs_ids})
	) As PivDest1
), PTable AS (
	SELECT 
		StudentId, 
		${crs_prs}
	FROM (
		SELECT StudentId, CourseId, PR FROM MarksList
	) As CWPiv
	PIVOT (
		MAX(PR) 
		FOR CourseId IN (${crs_ids})
	) As PivDest1
), ETable AS (
	SELECT 
		StudentId, 
		${crs_ecs}
	FROM (
		SELECT StudentId, CourseId, Exc FROM MarksList
	) As CWPiv
	PIVOT (
		MAX(Exc) 
		FOR CourseId IN (${crs_ids})
	) As PivDest1
), PGPAsList AS (
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
) SELECT SList.StudentId, SList.[Index], SList.UnivNo, SList.NameArabic,
	${crs_tot}, 
	ABCount, (CASE WHEN ABCount = 0 THEN GPA ELSE NULL END) AS GPA, ${prevGPAs}, 
	(CASE WHEN ABCount = 0 THEN ${cgpaFormula} ELSE NULL END) AS CGPA
FROM 
	SList 
	INNER JOIN EXTable ON (SList.StudentId = EXTable.StudentId) 
	INNER JOIN CWTable ON (SList.StudentId = CWTable.StudentId)
	INNER JOIN PTable ON (SList.StudentId = PTable.StudentId)
	INNER JOIN ETable ON (SList.StudentId = ETable.StudentId)
	INNER JOIN GPAsList ON (SList.StudentId = GPAsList.StudentId)
	INNER JOIN GPAsTable ON (SList.StudentId = GPAsTable.StudentId)
ORDER BY dbo.fn_IndexOrder(SList.[Index], ${SDepartmentId})`;
    return qry;
};
module.exports = result_sql_query;
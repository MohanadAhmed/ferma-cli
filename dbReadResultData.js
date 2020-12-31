const { sqlConn } = require('./dbconn')
const result_sql_query = require('./result_sql_query')

async function dbReadResultData(opts) {
    const { YearId, GradeId, SemesterId, DepartmentId, AllDepartments } = opts;
    const { StudentDepartmentId, AllStudentDepartments, DisciplineId, AllDisciplines } = opts;

    function courseOrdering(courseList) {
        return courseList;
    }

    // Get Disciplines Data
    const disciplines_query =
        `SELECT YearId, GradeId, SemesterId, DisciplineId, Disciplines.DepartmentId, 
        Departments.NameEnglishShort as Department,
        Departments.NameArabic as DepartmentArabic,  
        Disciplines.NameEnglishShort as Discipline,
        Disciplines.NameArabic as DisciplineArabic,
        HeadNameArabic
    FROM OfferedDisciplines 
        INNER JOIN Disciplines ON (OfferedDisciplines.DisciplineId = Disciplines.Id) 
        INNER JOIN Departments ON (Disciplines.DepartmentId = Departments.Id)
        INNER JOIN DepartmentHeads ON (DepartmentHeads.DepartmentId = Disciplines.DepartmentId)
    WHERE YearId = ${YearId} AND GradeId = ${GradeId} AND SemesterId = ${SemesterId} AND 
        DisciplineId IN (
            SELECT Id FROM Disciplines WHERE ((DepartmentId = ${DepartmentId}) OR ${Number(AllDepartments)}=1) AND
                ((Id = ${DisciplineId}) OR ${Number(AllDisciplines)}=1)
        );
    `

    const depts_disciplines_query =
        `SELECT DISTINCT YearId, GradeId, SemesterId, 
        SemesterBatchEnrollments.DepartmentId, SemesterBatchEnrollments.DisciplineId, 
        Departments.NameEnglishShort AS 'SDepartment',
        Departments.NameArabic as SDepartmentArabic,
        Disciplines.NameEnglishShort AS 'SDiscipline'
    FROM SemesterBatchEnrollments
	    INNER JOIN Disciplines ON (SemesterBatchEnrollments.DisciplineId = Disciplines.Id)
	    INNER JOIN Departments ON (SemesterBatchEnrollments.DepartmentId = Departments.Id)
    WHERE YearId = ${YearId} AND GradeId = ${GradeId} AND SemesterId = ${SemesterId} AND DisciplineId IN (
	    SELECT Id FROM Disciplines WHERE (DepartmentId = ${DepartmentId} OR (${Number(AllDepartments)}=1))
    ) AND (SemesterBatchEnrollments.DepartmentId = ${StudentDepartmentId} OR (${Number(AllStudentDepartments)}=1));`;

    const adminHeads_query = `SELECT * FROM AdminHeads;`;

    const courses_headers_query =
        `SELECT OC.CourseId, CourseCode, TitleEnglish, CreditHours, CourseworkFraction, ExamFraction
    FROM CourseDisciplines AS CD
        INNER JOIN OfferedCourses AS OC ON (CD.YearId = OC.YearId AND CD.GradeId = OC.GradeId AND 
            OC.SemesterId = CD.SemesterId AND CD.CourseId = OC.CourseId)
        INNER JOIN Courses ON (OC.CourseId = Courses.Id)
    WHERE CD.YearId = ${YearId} AND CD.GradeId = ${GradeId} AND CD.SemesterId <= ${SemesterId} AND `;



    try {
        let pool = await sqlConn;
        let req = await pool.request();
        console.log('Querying Disciplines for Department')
        let res = (await req.query(disciplines_query + depts_disciplines_query + adminHeads_query))

        discs = res.recordsets[0];
        deptdiscs_pairs = res.recordsets[1];
        adminHeads = res.recordsets[2];

        var crs_query = discs.map((elem) => {
            var dispid = elem["DisciplineId"];
            return (courses_headers_query + dispid + ' = DisciplineId;');
        }).join('\n')

        let crsLists = (await req.query(crs_query));

        resultsData = [];

        for (var ind in deptdiscs_pairs) {
            const ddpair = deptdiscs_pairs[ind];
            const sDisciplineId = ddpair['DisciplineId'];
            const sDepartmentId = ddpair['DepartmentId'];
            const adminDisc = discs.find((d) => d['DisciplineId'] == sDisciplineId)
            const aDepartmentId = adminDisc['DepartmentId'];

            console.log(`Collceting result data for Admin Dept = ${aDepartmentId}, Student Dept = ${sDepartmentId}, DisciplineId = ${sDisciplineId}`)

            const discInd = discs.findIndex(d => { return d['DisciplineId'] == sDisciplineId })

            const crsLx = crsLists.recordsets[discInd];

            var crs_ids = crsLx.map(c => { return '[' + c['CourseId'] + ']' }).join(', ')
            var crs_cws = crsLx.map(c => { var cid = c['CourseId']; return '[' + cid + '] AS [' + cid + '-CW]' }).join(', ')
            var crs_exs = crsLx.map(c => { var cid = c['CourseId']; return '[' + cid + '] AS [' + cid + '-EX]' }).join(', ')
            var crs_prs = crsLx.map(c => { var cid = c['CourseId']; return '[' + cid + '] AS [' + cid + '-PR]' }).join(', ')
            var crs_ecs = crsLx.map(c => { var cid = c['CourseId']; return '[' + cid + '] AS [' + cid + '-EC]' }).join(', ')
            var crs_tot = crsLx.map(c => {
                var cid = c['CourseId'];
                return '[' + cid + '-CW], [' + cid + '-EX], [' + cid + '-PR], [' + cid + '-EC]'
            }).join(', ')

            const results_query = result_sql_query({
                YearId: ddpair['YearId'],
                GradeId: ddpair['GradeId'],
                SemesterId: ddpair['SemesterId'],
                SDepartmentId: sDepartmentId,
                SDisciplineId: sDisciplineId,
                crs_ids, crs_cws, crs_exs, crs_prs, crs_ecs, crs_tot
            })

            // require('fs').writeFileSync('query.log', results_query)

            let mdata = (await req.query(results_query));

            var registrar = adminHeads.find(a => { return a.PositionTitleEnglish == 'Faculty Registrar' })
            var deputyDean = adminHeads.find(a => { return a.PositionTitleEnglish == 'Deputy Dean for Academic Affairs' })
            var dean = adminHeads.find(a => { return a.PositionTitleEnglish == 'Dean' })

            resultsData.push({
                YearId: ddpair['YearId'],
                GradeId: ddpair['GradeId'],
                SemesterId: ddpair['SemesterId'],
                AdminDepartment: adminDisc['Department'],
                AdminDepartmentArabic: adminDisc['DepartmentArabic'],
                StudentDepartment: ddpair['SDepartment'],
                StudentDepartmentArabic: ddpair['SDepartmentArabic'],
                Discipline: adminDisc['Discipline'],
                DisciplineArabic: adminDisc['DisciplineArabic'],
                // DepartmentId: aDepartmentId,
                // SDepartmentId: sDepartmentId,
                // DisciplineId: sDisciplineId,
                Courses: crsLx,
                MarksData: mdata.recordsets[0],
                Signatures: [
                    {Name: adminDisc['HeadNameArabic'], Position: 'رئيس قسم ' + adminDisc['DepartmentArabic']},
                    {Name: registrar.NameArabic, Position: registrar.PositionTitleArabic},
                    {Name: deputyDean.NameArabic, Position: deputyDean.PositionTitleArabic},
                    {Name: dean.NameArabic, Position: dean.PositionTitleArabic},
                ]
            })
        }
        return resultsData;
    } catch (err) {
        console.error('getDisciplines: ', err)
        // return null;
        process.exit();
    } finally {
        // process.exit()
    }
    // Get Courses Data

    // Get Student and Marks Data

    // Get previous results if any or calculate if not available
}

module.exports = dbReadResultData;
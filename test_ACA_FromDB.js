const xl = require('excel4node')
const genAcaSmrySheet = require('./genAcaSmrySheet')
const { sqlConn } = require('./dbconn')
const aca_data_query = require('./aca_data_query')

const grades = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'];

async function test_ACA_FromDB(opts) {
    var wb = new xl.Workbook({
        defaultFont: {
            name: 'Sakkal Majalla',
            size: 14
        },
        dateFormat: 'mm/dd/yyyy hh:mm:ss',
        logLevel: 1,
        workbookView: {
            windowWidth: 28800,
            windowHeight: 17620,
            xWindow: 240,
            yWindow: 480,
        },
        author: 'Mohanad Ahmed',
        calculationProperties: {
            fullCalculationOnLoad: true
        }
    })

    const { SubSuppResults } = opts;
    const { YearId, GradeId, SemesterId, DepartmentId, AllDepartments } = opts;
    const { StudentDepartmentId, AllStudentDepartments, DisciplineId, AllDisciplines } = opts;

    console.log('ACA Summary generation from Database ...')

    const depts_disciplines_query = `SELECT DISTINCT YearId, GradeId, SemesterId, 
    SemesterBatchEnrollments.DepartmentId, SemesterBatchEnrollments.DisciplineId, 
    Departments.NameEnglishShort AS 'SDepartment',
    Departments.NameArabic as SDepartmentArabic,
    Disciplines.NameEnglishShort AS 'SDiscipline'
FROM SemesterBatchEnrollments
    INNER JOIN Disciplines ON (SemesterBatchEnrollments.DisciplineId = Disciplines.Id)
    INNER JOIN Departments ON (SemesterBatchEnrollments.DepartmentId = Departments.Id)
WHERE YearId = ${YearId} AND GradeId = ${GradeId} AND SemesterId = ${SemesterId} AND DisciplineId IN (
    SELECT Id FROM Disciplines WHERE (DepartmentId = ${DepartmentId} OR (${Number(AllDepartments)}=1))
) AND (SemesterBatchEnrollments.DepartmentId = ${StudentDepartmentId} OR (${Number(AllStudentDepartments)}=1));
`;
    const extCounts_query = `;WITH ExtCounts AS (
    SELECT DepartmentId, COUNT(*) AS CNT
    FROM BatchEnrollments 
    WHERE YearId = 2018 AND GradeId = 4 AND (DepartmentID = 3 OR (1=1)) AND EnrollmentTypeId = 3
    GROUP BY DepartmentId
) SELECT * 
FROM Departments LEFT JOIN ExtCounts ON (Departments.Id = ExtCounts.DepartmentId)`

    const adminHeads_query = `SELECT * FROM AdminHeads;`;

    let pool = await sqlConn;
    let req = await pool.request();
    let res = (await req.query(depts_disciplines_query + adminHeads_query + extCounts_query))

    deptdiscs_pairs = res.recordsets[0];
    adminHeads = res.recordsets[1];
    extCountsDept = res.recordsets[2];

    var deptsList = deptdiscs_pairs.filter((v, ind, slf) => {
        return (ind == slf.findIndex((x) => {
            return v.DepartmentId == x.DepartmentId
        }))
    })

    for (dept of deptsList) {
        const d_extCount = extCountsDept.find(x => (x.DepartmentId == dept.DepartmentId))?.CNT;
        const aca_qry = aca_data_query({
            YearId,
            GradeId,
            SemesterId,
            SDepartmentId: (!AllStudentDepartments) ? StudentDepartmentId : dept.DepartmentId,
            SAllDepartments: false,
            ExternalsCount: d_extCount
        });

        const aca_data = {
            'FacultyName': 'كلية الهندسة',
            'AcademicYear': `${YearId}/${YearId + 1}`,
            'AcademicGrade': grades[GradeId - 1],
            'Department': dept.SDepartmentArabic.replace('المكلف', ''),
            'Discipline': dept.SDiscipline,
            'BoardMeetingNo': 'NNNN/MM',
            'BoardMeetingDate': (new Date()).toLocaleDateString('en-GB', { timeZone: 'Asia/Riyadh' }),
            'DepartmentEnglish': dept.SDepartment,
            'DisciplineEnglish': null,

            'AcademicYear_M_1': `${YearId - 1}/${YearId}`,
            'AcademicYear_M_2': `${YearId - 2}/${YearId - 1}`,

            'RegistrarName': adminHeads.find(a => { return a.PositionTitleEnglish == 'Faculty Registrar' }).NameArabic,
            'DeputyDeanName': adminHeads.find(a => { return a.PositionTitleEnglish == 'Deputy Dean for Academic Affairs' }).NameArabic,
            'DeanName': adminHeads.find(a => { return a.PositionTitleEnglish == 'Dean' }).NameArabic,

            'HonorsGraduates': ACA_Type(GradeId, d_extCount),
            dataTables: {}
        }

        var sheetName = `ACA-${aca_data.DepartmentEnglish || 'All'}-${aca_data.DisciplineEnglish || 'All'}`;
        console.log('Generating ', sheetName, '...')
        try {
            let res = (await req.query(aca_qry))
            if (aca_data.HonorsGraduates == 'Full') {
                regStud = res.recordsets[0];
                regHonr = res.recordsets[1];
                extStud = res.recordsets[2];
                extHonr = res.recordsets[3];
                aca_data.dataTables.RegStudents = ConvertRegStuds(YearId, regStud);
                aca_data.dataTables.RegStudentsHonours = ConvertRegHonors(YearId, regHonr);
                aca_data.dataTables.ExtStudents = ConvertExtStuds(YearId, extStud);
                aca_data.dataTables.ExtStudentsHonours = ConvertExtHonors(YearId, extHonr);
            } else if (aca_data.HonorsGraduates == 'RegularGrads') {
                regStud = res.recordsets[0];
                regHonr = res.recordsets[1];
                aca_data.dataTables.RegStudents = ConvertRegStuds(YearId, regStud);
                aca_data.dataTables.RegStudentsHonours = ConvertRegHonors(YearId, regHonr);
            } else {
                regStud = res.recordsets[0];
                extStud = res.recordsets[1];
                aca_data.dataTables.RegStudents = ConvertRegStuds(YearId, regStud);
                aca_data.dataTables.ExtStudents = ConvertExtStuds(YearId, extStud);
            }
            genAcaSmrySheet(wb, sheetName, aca_data);
        } catch (err) {
            console.error('getDisciplines: ', err)
            require('fs').writeFileSync('query.log', aca_qry)
            process.exit();
        } finally {
            // process.exit()
        }
    }
    console.log('Writing out Workbook')
    wb.write('ACATest.xlsx', (err, stats) => {
        console.log('Done Writing Workbook')
        process.exit()
    })
    function ACA_Type(GradeId, ExternalsCount) {
        if (GradeId == 5 && ExternalsCount == 0) {
            return 'RegularGrads'
        } else if (GradeId == 5 && ExternalsCount > 0) {
            return 'Full'
        } else {
            return 'Undergrad';
        }
    }
}
function getRecordArr(res, Num, YearId) {
    const YN0 = YearId.toString()
    const YN1 = (YearId - 1).toString();
    const YN2 = (YearId - 2).toString();
    var z = res.find(v => (v.Nm == Num))
    if (!z) return z;
    n0 = z[YN0] ? z[YN0] : 0;
    n1 = z[YN1] ? z[YN1] : 0;
    n2 = z[YN2] ? z[YN2] : 0;

    return [n0, n1, n2, z.Label];
}

function ConvertRegStuds(YearId, res) {
    return {
        "Total": getRecordArr(res, 1, YearId),
        "Examined": getRecordArr(res, 2, YearId),
        "Passed": getRecordArr(res, 3, YearId),
        "Subs": getRecordArr(res, 4, YearId),
        "Supp": getRecordArr(res, 5, YearId),
        "SubsSupp": getRecordArr(res, 6, YearId),
        "Repeat": getRecordArr(res, 7, YearId),
        "Dismissals": getRecordArr(res, 8, YearId),
        "Recess": getRecordArr(res, 9, YearId),
        "SpecialCases": getRecordArr(res, 10, YearId),
        "CheatCases": getRecordArr(res, 11, YearId),
    }
}
function ConvertRegHonors(YearId, res) {
    x1 = getRecordArr(res, 1, YearId);
    x2 = getRecordArr(res, 2, YearId);
    x3 = getRecordArr(res, 3, YearId);
    x4 = getRecordArr(res, 4, YearId);
    return {
        Total: [
            x1[0] + x2[0] + x3[0] + x4[0],
            x1[1] + x2[1] + x3[1] + x4[1],
            x1[2] + x2[2] + x3[2] + x4[2],
            "العدد الكلي"],
        FirstClass: x1,
        SecondClassFirst: x2,
        SecondClassSecond: x3,
        ThirdClass: x4,
    }
}
function ConvertExtStuds(YearId, res) {
    return {
        "Total": getRecordArr(res, 1, YearId),
        "Examined": getRecordArr(res, 2, YearId),
        "Passed": getRecordArr(res, 3, YearId),
        "Subs": getRecordArr(res, 4, YearId),
        "Supp": getRecordArr(res, 5, YearId),
        "SubsSupp": getRecordArr(res, 6, YearId),
        "Failed": getRecordArr(res, 7, YearId),
        "SpecialCases": getRecordArr(res, 8, YearId),
        "CheatCases": getRecordArr(res, 9, YearId),
    }
}
function ConvertExtHonors(YearId, res) {
    x1 = getRecordArr(res, 1, YearId);
    x2 = getRecordArr(res, 2, YearId);
    x3 = getRecordArr(res, 3, YearId);
    x4 = getRecordArr(res, 4, YearId);
    return {
        Total: [
            x1[0] + x2[0] + x3[0] + x4[0],
            x1[1] + x2[1] + x3[1] + x4[1],
            x1[2] + x2[2] + x3[2] + x4[2],
            "العدد الكلي"],
        FirstClass: x1,
        SecondClassFirst: x2,
        SecondClassSecond: x3,
        ThirdClass: x4,
    }
}

module.exports = test_ACA_FromDB;
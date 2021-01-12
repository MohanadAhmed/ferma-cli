const env_res = require('dotenv').config()
if (env_res.error) {
    console.error(env_res.error)
    process.exit()
}
const dbReadResultData = require('./dbReadResultData')
const { sql } = require('./dbConn')
const genResultFiles = require('./genResultFiles')
const processRecommendation = require('./processRecommendation')

async function getData() {
    var t_start = Date.now();
    var xdata = await dbReadResultData({
        YearId: 2016, 
        GradeId: 1,
        SemesterId: 2,
        SubSuppResults: true,
        DepartmentId: 0,
        AllDepartments: true,
        StudentDepartmentId: 0,
        AllStudentDepartments: true,
        DisciplineId: 0,
        AllDisciplines: true
    });
    // var xdata = await dbReadResultData({
    //     YearId: 2017,
    //     GradeId: 5,
    //     SemesterId: 2,
    //     DepartmentId: 5,
    //     AllDepartments: false,
    //     StudentDepartmentId: 5,
    //     AllStudentDepartments: false,
    //     DisciplineId: 0,
    //     AllDisciplines: true
    // });

    // require('fs').writeFileSync('data2.json.log', JSON.stringify(xdata, null, 2))
    genResultFiles(xdata, 'test.xlsx');
    sql.close()
    var t_end = Date.now();
    console.log("Total Time: ", (t_end - t_start), "msec");
}

async function getData_SubSupp(){

}

getData()

// sqlConn.then((val) => {
//     val.close();
// })
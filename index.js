const env_res = require('dotenv').config()
if(env_res.error){
    console.error(env_res.error)
    process.exit()
}
const dbReadResultData = require('./dbReadResultData')
const { sql } = require('./dbConn')
const genResultFiles = require('./genResultFiles')
const processRecommendation = require('./processRecommendation')

console.log(genResultFiles)

async function getData(){
    // var xdata = await dbReadResultData({
    //     YearId: 2018, 
    //     GradeId: 1,
    //     SemesterId: 2,
    //     DepartmentId: 9,
    //     AllDepartments: false,
    //     StudentDepartmentId: 0,
    //     AllStudentDepartments: true,
    //     DisciplineId: 1,
    //     AllDisciplines: false
    // });
    var xdata = await dbReadResultData({
        YearId: 2017, 
        GradeId: 2,
        SemesterId: 2,
        DepartmentId: 4,
        AllDepartments: false,
        StudentDepartmentId: 4,
        AllStudentDepartments: false,
        DisciplineId: 0,
        AllDisciplines: true
    });

    require('fs').writeFileSync('data2.json.log', JSON.stringify(xdata, null, 2))
    genResultFiles(xdata, 'test.xlsx');
    sql.close()
    
}

getData()

// sqlConn.then((val) => {
//     val.close();
// })
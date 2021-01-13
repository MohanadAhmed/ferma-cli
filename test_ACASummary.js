const xl = require('excel4node')
const genAcaSmrySheet = require('./genAcaSmrySheet')

const aca_data = {
    'FacultyName': 'كلية الهندسة',
    'AcademicYear': '2018/2019',
    'AcademicGrade': 'الرابع',
    'Department': 'الهندسة الكهربائية و الإلكترونية',
    'Discipline': 'غير متخصص',
    'BoardMeetingNo': '2019/06',
    'BoardMeetingDate': '07/12/2020',
    'DepartmentEnglish': 'Electrical',
    'DisciplineEnglish': 'Electroncis',

    'AcademicYear_M_1': '2017/2018',
    'AcademicYear_M_2': '2016/2017',

    RegistrarName: 'أ. المحيا الأمين خلف الله محمد خير',
    DeputyDeanName: 'د. مجدي محمد زمراوي',
    DeanName: 'د.علي محمد علي السيوري',

    'HonorsGraduates': 'RegularGrads',

    dataTables: {
        RegStudents: {
            "Total": [100, 90, 85, "العدد الكلي"],
            "Examined": [80, 75, 70, "الجالسون"],
            "Passed": [75, 70, 65, "النجاح"],
            "Subs": [3, 2, 4, "البدائل"],
            "Supp": [2, 3, 1, "ازالة الرسوب (الملاحق)"],
            "SubsSupp": [1, 0, 3, "البدائل وازالة الرسوب"],
            "Repeat": [0, 1, 2, "اعادة العام"],
            "Dismissals": [0, 2, 1, "المفصولون"],
            "Recess": [0, 0, 0, "المجمدون"],
            "SpecialCases": [0, 0, 0, "حالات خاصة"],
            "CheatCases": [0, 1, 2, "حالات مخالفة لائحة الامتحانات"]
        },
        ExtStudents: {
            "Total": [100, 90, 85, 'العدد الكلي'],
            "Examined": [80, 75, 70, 'الجالسون'],
            "Passed": [75, 70, 65, 'النجاح'],
            "Subs": [3, 2, 4, 'البدائل'],
            "Supp": [2, 3, 1, 'ازالة الرسوب (الملاحق)'],
            "SubsSupp": [1, 0, 3, 'البدائل وازالة الرسوب'],
            "Failed": [0, 1, 2, 'الراسبون'],
            "SpecialCases": [0, 0, 0, 'حالات خاصة'],
            "CheatCases": [0, 1, 2, 'حالات مخالفة لائحة الامتحانات']
        },
        RegStudentsHonours: {
            Total: [30, 25, 23, "العدد الكلي"],
            FirstClass: [20, 15, 19, "مرتبة الشرف الأولى"],
            SecondClassFirst: [10, 14, 18, "مرتبة الشرف الثانية - القسم الأول"],
            SecondClassSecond: [1, 2, 3, "مرتبة الشرف الثانية - القسم الثاني"],
            ThirdClass: [4, 5, 6, "مرتبة الشرف الثالثة"]
        },
        ExtStudentsHonours: {
            Total: [30, 25, 23, "العدد الكلي"],
            FirstClass: [20, 15, 19, "مرتبة الشرف الأولى"],
            SecondClassFirst: [10, 14, 18, "مرتبة الشرف الثانية - القسم الأول"],
            SecondClassSecond: [1, 2, 3, "مرتبة الشرف الثانية - القسم الثاني"],
            ThirdClass: [4, 5, 6, "مرتبة الشرف الثالثة"]
        }
    }
}

async function test_ACASummary() {
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

    genAcaSmrySheet(wb, aca_data);

    wb.write('test.xlsx')
}

module.exports = test_ACASummary;
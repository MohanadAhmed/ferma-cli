const xlwriter = require('excel4node')

function genResultFiles(resultsData, filename) {
    var wb = new xlwriter.Workbook()

    var options = {
        margins: { 'bottom': 1.45, 'footer': 0.3, 'header': 0.3, 'left': 0.25, 'right': 0.21, 'top': 1.25 },
        pageSetup: { paperSize: 'A4_PAPER', orientation: 'landscape' },
        printOptions: { centerHorizontal: true },
        sheetView: { rightToLeft: true }
    };

    var { failedMarkStyle,
        DMarkStyle,
        ABMarkStyle,
        BadRecStyle,
        student_colHeadStyle,
        course_colHeadStyle,
        student_dataStyle,
        gpaStyle,
        marksStyle,
        studentNameStyle } = CreateWorkbookStyles();

    for (res of resultsData) {
        var isNonSpecialized = res.Discipline.includes('Non-Specialized'); 
        courseData = res['Courses'];
        marksData = res['MarksData'];
        resAdminData = {
            sheetName: isNonSpecialized ? res.StudentDepartment : res.Discipline,
            MeetingResult: false,
            Year: `${res.YearId}/${res.YearId+1}`,
            Grade:  res.GradeId,
            Semester: res.SemesterId,
            AdminDepartment: res.AdminDepartment,
            AdminDepartmentArabic: res.AdminDepartmentArabic,
            StudentDepartment: res.StudentDepartment,
            StudentDepartmentArabic: res.StudentDepartmentArabic,
            Discipline: res.Discipline,
            DisciplineArabic: res.DisciplineArabic
        }
        GenerateDetailedResultWorksheet(courseData, marksData, resAdminData);
    }
    wb.write(filename)

    
    function GetHeaderText(resAdminData){
        const ResultTitleTexts = [
            "نتائج الفصل الأول للعام ",
            "النتائج النهائية للعام  ",
            "نتائج الملاحق و البدائل للعام "
        ];
        const g_grades = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"];

        var DepartmentHeadTitle = resAdminData.StudentDepartmentArabic.replace('المكلف', '');
        var resultTitle = ResultTitleTexts[resAdminData.Semester-1];

        return `&Cبسم الله الرحمن الرحيم
        جامعة الخرطوم - كلية الهندسة
        قسم ${DepartmentHeadTitle}
        ${resultTitle}  ${resAdminData.Year}
        المستوى ${g_grades[resAdminData.Grade-1]}`;
    }

    function GenerateDetailedResultWorksheet(coursesList, marksData, resAdminData) {
        // console.log(resAdminData)
        sheetName = resAdminData.sheetName;
        var MeetingResult = resAdminData.MeetingResult;

        console.log(`Adding sheet ${sheetName}`)

        headerText = GetHeaderText(resAdminData);
        options.headerFooter = {
            'evenFooter': '',
            'evenHeader': headerText,
            'firstFooter': '',
            'firstHeader': headerText,
            'oddFooter': '',
            'oddHeader': headerText,
        }
        var ws = wb.addWorksheet(sheetName, options);
        var courseColumnStep = MeetingResult ? 2 : 1;

        function ApplyConditionalFormatForString(lookFor, range, startCell, formatStyle, priority) {
            ws.addConditionalFormattingRule(range, {
                type: 'expression',
                priority: (priority) ? priority : 1,
                formula: `=NOT(ISERROR(SEARCH("${lookFor}", ${startCell})))`,
                style: formatStyle,
            });
        }

        var marksStartRow = MeetingResult ? 4 : 4;
        var marksEndRow = marksStartRow + marksData.length;
        var marksStartColumn = 5;
        var marksEndColumn = marksStartColumn + coursesList.length * courseColumnStep - 1;

        var gpaStartColumn = marksStartColumn + coursesList.length * courseColumnStep;

        var marksStartRef = xlwriter.getExcelCellRef(marksStartRow, marksStartColumn);
        var marksEndRef = xlwriter.getExcelCellRef(marksEndRow, marksEndColumn);

        ApplyConditionalFormatForString("F", `${marksStartRef}:${marksEndRef}`, `${marksStartRef}`, failedMarkStyle);
        ApplyConditionalFormatForString("D", `${marksStartRef}:${marksEndRef}`, `${marksStartRef}`, DMarkStyle);
        ApplyConditionalFormatForString("AB", `${marksStartRef}:${marksEndRef}`, `${marksStartRef}`, ABMarkStyle);

        var recStartCell = xlwriter.getExcelCellRef(marksStartRow, gpaStartColumn + 2);
        var recEndCell = xlwriter.getExcelCellRef(marksStartRow + marksData.length, gpaStartColumn + 2);

        ApplyConditionalFormatForString("B*", `${recStartCell}:${recEndCell}`, `${recStartCell}`, ABMarkStyle, 2);
        ApplyConditionalFormatForString("RTW", `${recStartCell}:${recEndCell}`, `${recStartCell}`, BadRecStyle);
        ApplyConditionalFormatForString("R", `${recStartCell}:${recEndCell}`, `${recStartCell}`, BadRecStyle);
        ApplyConditionalFormatForString("S?", `${recStartCell}:${recEndCell}`, `${recStartCell}`, failedMarkStyle);

        ws.row(1).setHeight(25);
        ws.row(2).setHeight(35);

        ws.column(1).setWidth(4);
        ws.column(2).setWidth(6.25);
        ws.column(3).setWidth(9.25);
        ws.column(4).setWidth(25);

        // ws.addImage({
        //     path: '../logo.png',
        //     type: 'picture',
        //     position: {
        //         type: 'absoluteAnchor',
        //         x: '1in',
        //         y: '2in',
        //     }
        // })

        for (let n = marksStartColumn; n < gpaStartColumn; n++) {
            var nCols = coursesList.length * courseColumnStep;
            if (nCols >= 18) {
                ws.column(n).setWidth(2.6 * MeetingResult + 4 * (!MeetingResult));
            } else if (nCols > 16) {
                ws.column(n).setWidth(3.0 * MeetingResult + 4.0 * (!MeetingResult));
            } else if (nCols > 10) {
                ws.column(n).setWidth(4 * MeetingResult + 4 * (!MeetingResult));
            } else {
                ws.column(n).setWidth(4 * MeetingResult + 10 * (!MeetingResult));
            }

        }
        ws.column(gpaStartColumn).setWidth(4.25);
        ws.column(gpaStartColumn + 1).setWidth(4.25);
        ws.column(gpaStartColumn + 2).setWidth(9);

        ws.cell(1, 1, 3, 1, true).string('No').style(student_colHeadStyle);
        ws.cell(1, 2, 3, 2, true).string('Index').style(student_colHeadStyle);
        ws.cell(1, 3, 3, 3, true).string('Univ. No.').style(student_colHeadStyle);
        ws.cell(1, 4, 3, 4, true).string('Name').style(student_colHeadStyle);
        ws.cell(1, gpaStartColumn, 3, gpaStartColumn, true).string('GPA').style(student_colHeadStyle).style({ alignment: { textRotation: 90 } });
        ws.cell(1, gpaStartColumn + 1, 3, gpaStartColumn + 1, true).string('CGPA').style(student_colHeadStyle).style({ alignment: { textRotation: 90 } });
        ws.cell(1, gpaStartColumn + 2, 3, gpaStartColumn + 2, true).string('RECOM.').style(student_colHeadStyle).style({ alignment: { textRotation: 90 } });

        // if (MeetingResult) ws.cell(2, 3).string('Exam | CW').style(course_colHeadStyle);
        // if (MeetingResult) ws.cell(3, 3).string(' Max | Pass').style(course_colHeadStyle);

        // ws.cell(MeetingResult ? 4 : 3, 3).string('Credit Hours').style(course_colHeadStyle);

        wb.definedNameCollection.addDefinedName({
            name: "_xlnm.Print_Titles",
            localSheetId: ws.localSheetId,
            refFormula: MeetingResult ? `'${ws.name}'!$1:$3` : `'${ws.name}'!$1:$3`
        });

        for (let n = 0; n < marksData.length; n++) {

            ws.row(marksStartRow + n).setHeight(20);

            ws.cell(marksStartRow + n, 1).number(n + 1).style(student_dataStyle);
            ws.cell(marksStartRow + n, 2).number(marksData[n].Index).style(student_dataStyle);
            if (marksData[n].UnivNo) ws.cell(marksStartRow + n, 3).string(marksData[n].UnivNo).style(student_dataStyle);
            else ws.cell(marksStartRow + n, 3).style(student_dataStyle);

            var namePlaceholder = marksData[n].NameArabic; //? studentsList[n].name : 'محمد عبدالله جادالحق علي' + n;

            ws.cell(marksStartRow + n, 4)
                .string(namePlaceholder)
                .style(studentNameStyle);

            if (marksData[n].GPA) {
                ws.cell(marksStartRow + n, gpaStartColumn)
                    .number(marksData[n].GPA)
                    .style(gpaStyle);
            } else {
                ws.cell(marksStartRow + n, gpaStartColumn).style(gpaStyle);
            }
            // if (marksData[n].cgpa) {
            //     ws.cell(marksStartRow + n, gpaStartColumn + 1)
            //         .number(resultsList[n].cgpa)
            //         .style(gpaStyle);
            // }
            // if (marksData[n].rec) {
            //     ws.cell(marksStartRow + n, gpaStartColumn + 2)
            //         .string(resultsList[n].rec)
            //         .style(gpaStyle);
            // }
        }

        for (let n = 0; n < coursesList.length; n++) {
            var colx = marksStartColumn + n * courseColumnStep

            if (!MeetingResult) {
                ws.cell(1, colx, 2, colx + MeetingResult, true)
                    .string(coursesList[n].CourseCode)
                    .style(course_colHeadStyle).style({ font: { size: 10, bold: true }, alignment: { textRotation: 90 } });

                ws.cell(3, colx).number(coursesList[n].CreditHours).style(course_colHeadStyle);
            }
            else {
                ws.cell(3, marksStartColumn + n * 2)
                    .number(coursesList[n].examFraction)
                    .style(course_colHeadStyle);
                if (coursesList[n].cwFraction)
                    ws.cell(3, marksStartColumn + n * 2 + 1)
                        .number(coursesList[n].cwFraction).style(course_colHeadStyle);

                else
                    ws.cell(3, marksStartColumn + n * 2 + 1)
                        .number(Math.max(100 - coursesList[n].examFraction, 0)).style(course_colHeadStyle);


                ws.cell(4, marksStartColumn + n * 2)
                    .number(Math.max(100, coursesList[n].examFraction)).style(course_colHeadStyle);

                ws.cell(4, marksStartColumn + n * 2 + 1)
                    .number(coursesList[n].PassMark).style(course_colHeadStyle);
            }
        }

        for (let n = 0; n < marksData.length; n++) {
            for (let m = 0; m < coursesList.length; m++) {
                if (!MeetingResult) {
                    var cid = coursesList[m].CourseId;
                    var exFraction = coursesList[m].ExamFraction
                    var cwFraction = coursesList[m].CourseworkFraction
                    var ex = marksData[n][cid + "-EX"]
                    var cw = marksData[n][cid + "-CW"]
                    var pr = marksData[n][cid + "-PR"]
                    var ec = marksData[n][cid + "-EC"]
                    let mkg = AssignGrade(ex, cw, pr, ec, cwFraction, exFraction)
                    
                    if(ex === null && cw === null && pr === null && ec === null){
                        mkg = {total: undefined, grade: 'NT'};
                        // console.log([ex,cw,pr,ec,exFraction, cwFraction], '|||||||', mkg)
                    }else{
                        // console.log([ex,cw,pr,ec,exFraction, cwFraction], '=======>', mkg)
                    }
                    
                    if (mkg.grade)
                        ws.cell(marksStartRow + n, marksStartColumn + m * courseColumnStep + MeetingResult)
                            .string(mkg.grade)
                            .style(marksStyle);
                }
            }
            // process.exit()
        }
        return;

        if (showRules) {
            ws.cell(2, gpaStartColumn + 3)
                .string('FG Rules')
                .style(student_colHeadStyle)
                .style({ alignment: { textRotation: 90 } });

            for (let n = 0; n < studentsList.length; n++) {
                ws.cell(marksStartRow + n, gpaStartColumn + 3)
                    .string(resultsList[n].rule)
                    .style(gpaStyle);
            }
        }

        if (res_comp) {
            ws.cell(2, gpaStartColumn + 4)
                .string('oGPA')
                .style(student_colHeadStyle)
                .style({ alignment: { textRotation: 90 } });
            ws.cell(2, gpaStartColumn + 5)
                .string('oRECOM.')
                .style(student_colHeadStyle)
                .style({ alignment: { textRotation: 90 } });
            if (res_comp[0]["cgpa"]) {
                ws.cell(2, gpaStartColumn + 6)
                    .string('oCGPA')
                    .style(student_colHeadStyle)
                    .style({ alignment: { textRotation: 90 } });
            }

            for (let n = 0; n < studentsList.length; n++) {
                if (res_comp[n].gpa)
                    ws.cell(marksStartRow + n, gpaStartColumn + 4).number(res_comp[n].gpa).style(gpaStyle);
                if (res_comp[n].rec)
                    ws.cell(marksStartRow + n, gpaStartColumn + 5).string(res_comp[n].rec).style(gpaStyle);
                if (res_comp[n]["cgpa"])
                    ws.cell(marksStartRow + n, gpaStartColumn + 6).number(res_comp[n].cgpa).style(gpaStyle);
            }
        }
    }

    function CreateWorkbookStyles() {
        var borderx = {
            left: { style: 'thin', color: 'black' },
            right: { style: 'thin', color: 'black' },
            top: { style: 'thin', color: 'black' },
            bottom: { style: 'thin', color: 'black' }
        };
        var student_colHeadStyle = wb.createStyle({
            font: { color: "black", size: 12, name: 'Times New Roman', bold: true },
            // fill: {
            //     type: "pattern",
            //     patternType: "solid",
            //     bgColor: "#C0FFC0",
            //     fgColor: "#C0FFC0"
            // },
            border: borderx,
            alignment: {
                horizontal: 'center',
                vertical: 'center'
            }
        });
        var course_colHeadStyle = wb.createStyle({
            font: { color: "black", size: 8, name: 'Times New Roman' },
            // fill: {
            //     type: "pattern",
            //     patternType: "solid",
            //     bgColor: "#B7DEE8",
            //     fgColor: "#B7DEE8"
            // },
            border: borderx,
            alignment: {
                wrapText: true,
                horizontal: 'center',
                vertical: 'center'
            },
        });
        var studentNameStyle = wb.createStyle({
            font: { name: 'Sakkal Majalla', size: 10, bold: true },
            alignment: { vertical: 'center', horizontal: 'right', indent: 1 },
            border: borderx
        })
        var student_dataStyle = wb.createStyle({
            font: { color: "black", size: 11, name: 'Times New Roman' },
            border: borderx,
            alignment: { horizontal: 'center', vertical: 'center' }
        });
        // Number Formatting: https://exceljet.net/custom-number-formats
        var marksStyle = wb.createStyle({
            font: { color: "black", size: 9, name: 'Calibri' },
            border: borderx,
            numberFormat: '#',
            alignment: { horizontal: 'center', vertical: 'center' }
        });

        var gpaStyle = {
            font: { color: "black", size: 10, name: 'Times New Roman', bold: true },
            border: borderx,
            numberFormat: 2,
            alignment: { horizontal: 'center', vertical: 'center' }
        };

        var failedMarkStyle = wb.createStyle({
            fill: { type: 'pattern', patternType: 'solid', fgColor: '#FFC7CE', bgColor: "#FFC7CE", },
            font: { color: "black", size: 10, name: 'Calibri', bold: true },
        });

        var DMarkStyle = wb.createStyle({
            fill: { type: 'pattern', patternType: 'solid', fgColor: '#FFE699', bgColor: "FFE699", },
            font: { color: "black", size: 10, name: 'Calibri', bold: true },
        });

        var ABMarkStyle = wb.createStyle({
            fill: { type: 'pattern', patternType: 'solid', fgColor: '#9BC2E6', bgColor: "9BC2E6", },
            font: { color: "black", size: 10, name: 'Calibri', bold: true },
        });

        var BadRecStyle = wb.createStyle({
            fill: { type: 'pattern', patternType: 'solid', fgColor: '#FF0000', bgColor: "#FF0000", },
            font: { color: "black", size: 10, name: 'Calibri', bold: true },
        });
        return {
            failedMarkStyle, DMarkStyle, ABMarkStyle, BadRecStyle, student_colHeadStyle, course_colHeadStyle, student_dataStyle,
            gpaStyle, marksStyle, studentNameStyle
        };
    }
}

function AssignGrade(ex, cw, present, excuse, cwFraction, examFraction) {
    var mktotal = undefined;
    var mkgrade = undefined;
    var cwmk = (cwFraction > 0) ? ((cw) ? cw : 0) : 0;
    var exmk = (examFraction > 0) ? ((ex) ? ex : 0) : 0;

    if (present) {
        if (examFraction == 100 && cwFraction == 0) {
            mktotal = exmk;
        } else if (examFraction == 0 && cwFraction == 100) {
            mktotal = cwmk;
        } else {
            mktotal = cwmk + exmk;
        }

        if (cwmk < 0.3 * cwFraction || exmk < 0.3 * examFraction) {
            mkgrade = "F";
            if (cwmk < 0.4 * cwFraction) mkgrade += "*";
        } else if (cwmk < 0.4 * cwFraction || exmk < 0.4 * examFraction) mkgrade = "D";
        else if (mktotal >= 90) mkgrade = "A+";
        else if (mktotal >= 80) mkgrade = "A";
        else if (mktotal >= 70) mkgrade = "A-";
        else if (mktotal >= 60) mkgrade = "B+";
        else if (mktotal >= 50) mkgrade = "B";
        else if (mktotal >= 40) mkgrade = "C";
    } else if (!present && (excuse || (excuse == undefined))) {
        if (cwmk < 0.4 * cwFraction) mkgrade = "AB*"; else mkgrade = "AB";
    } else if (!present && (excuse == 0)) {
        mktotal = cwmk;
        if (cwmk < 0.4 * cwFraction) mkgrade = "F*"; else mkgrade = "F";
    }
    return {
        total: mktotal,
        grade: mkgrade
    }
}

module.exports = genResultFiles;
const xl = require('excel4node')

function genAcaSmrySheet(wb, aca_data) {
    var sheetName = 'ACA-' + aca_data.DepartmentEnglish + '-' + aca_data.DisciplineEnglish;
    var ws = wb.addWorksheet(sheetName, {
        pageSetup: {
            paperSize: 'A4_PAPER',
            orientation: 'portrait',
            scale: 100,
        },
        sheetView: {
            'rightToLeft': true
        },
        printOptions: {
            'centerHorizontal': true,
        },
    })

    var crow = 1;
    var BigLabels = ['أولا', 'ثانيا', 'ثالثا', 'رابعا', 'خامسا', 'سادسا'];
    var tabNum = 0;

    SetColumnWidths();
    TitleBlock(); crow += 12;
    if (aca_data.HonorsGraduates == 'Full') {
        TableRegularStudents();
        crow += 1;
        TableRegusarStudentsHonours();
        Signatures();
        TableExternalStudents();
        TableExternalStudentsHonours();
        GraphRegularStuds();
        Signatures();
        GraphRegularStudsHonours();
        crow += 1;
        GraphExternalStudents();
        Signatures();
        GraphExternalStudHonours();
        BoardOpinion();
        crow += 3;
        Signatures();
    } else if (aca_data.HonorsGraduates == 'RegularGrads') {
        TableRegularStudents();
        TableRegusarStudentsHonours();
        crow += 1;
        Signatures();
        GraphRegularStuds();
        genGraph('مرتبة الشرف (نظاميون)', crow, 15, 33, 37)
        BoardOpinion();
        Signatures();
    } else {
        TableRegularStudents();
        TableExternalStudents();
        Signatures();
        GraphRegularStuds();
        genGraph('الممتحنون من الخارج', crow, 15, 33, 41);
        BoardOpinion();
        Signatures();
    }
    function getTitle(xtitle) {
        vTitle = BigLabels[tabNum++] + ': ' + xtitle;
        return vTitle;
    }
    function genSumFormulae(frow, srow, erow) {
        var sumStyle = {
            font: { bold: true, size: 14 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                left: { style: 'medium', color: 'black' },
                right: { style: 'medium', color: 'black' },
                top: { style: 'medium', color: 'black' },
                bottom: { style: 'medium', color: 'black' }
            }
        };
        ws.cell(frow, 2).string('المجموع').style(sumStyle)
        ws.cell(frow, 3).formula(`SUM(${xl.getExcelCellRef(srow, 3)}:${xl.getExcelCellRef(erow, 3)})`).style(sumStyle)
        ws.cell(frow, 4).formula(`SUM(${xl.getExcelCellRef(srow, 4)}:${xl.getExcelCellRef(erow, 4)})`).style(sumStyle)
        ws.cell(frow, 5).formula(`SUM(${xl.getExcelCellRef(srow, 5)}:${xl.getExcelCellRef(erow, 5)})`).style(sumStyle)
        ws.cell(frow, 6).formula(`SUM(${xl.getExcelCellRef(srow, 6)}:${xl.getExcelCellRef(erow, 6)})`).style(sumStyle)
        ws.cell(frow, 7).formula(`SUM(${xl.getExcelCellRef(srow, 7)}:${xl.getExcelCellRef(erow, 7)})`).style(sumStyle)
        ws.cell(frow, 8).formula(`SUM(${xl.getExcelCellRef(srow, 8)}:${xl.getExcelCellRef(erow, 8)})`).style(sumStyle)
    }
    function SetColumnWidths() {
        ws.column(1).width = 3.14;
        ws.column(2).width = 26.57;
        ws.column(3).width = 8.43;
        ws.column(4).width = 8.43;
        ws.column(5).width = 8.43;
        ws.column(6).width = 8.43;
        ws.column(7).width = 8.43;
        ws.column(8).width = 8.43;
    }
    function TitleBlock() {
        var titleStyle = {
            font: { bold: true, size: 18 },
            alignment: { horizontal: 'center', vertical: 'center' }
        };
        var bottom_titleStyle = {
            font: { bold: true, size: 18 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: { bottom: { style: 'thick', color: 'black' } }
        };

        var topLabelsStyle = {
            border: {
                left: { style: 'medium', color: 'black' },
                right: { style: 'medium', color: 'black' },
                top: { style: 'medium', color: 'black' },
                bottom: { style: 'medium', color: 'black' }
            },
            font: { bold: true }
        };

        var topDataStyle = {
            border: {
                left: { style: 'medium', color: 'black' },
                right: { style: 'medium', color: 'black' },
                top: { style: 'medium', color: 'black' },
                bottom: { style: 'medium', color: 'black' }
            },
            alignment: { horizontal: 'right' }
        };

        ws.row(1).height = 20.25;
        ws.row(2).height = 20.25;
        ws.row(3).height = 20.25;
        ws.row(4).height = 9.75;

        for (let n = 5; n < 12; n++) ws.row(5).height = 20;

        ws.cell(1, 2, 1, 8, true).string('جامعة الخرطوم').style(titleStyle);
        ws.cell(2, 2, 2, 8, true).string('أمانة الشؤون العلمية').style(titleStyle)
        ws.cell(3, 2, 3, 8, true).string('الإحصائية العامة لنتائج الامتحانات النهائية - الخريجون - مرتبة الشرف')
            .style(bottom_titleStyle)

        ws.cell(5, 2).string('الكلية').style(topLabelsStyle)
        ws.cell(6, 2).string('العام الدراسي').style(topLabelsStyle)
        ws.cell(7, 2).string('المستوى').style(topLabelsStyle)
        ws.cell(8, 2).string('القسم').style(topLabelsStyle)
        ws.cell(9, 2).string('التخصص').style(topLabelsStyle)
        ws.cell(10, 2).string('رقم اجتماع مجلس الكلية').style(topLabelsStyle)
        ws.cell(11, 2).string('تاريخ الاجتماع').style(topLabelsStyle)

        ws.cell(5, 3, 5, 8, true).string(aca_data.FacultyName).style(topDataStyle)
        ws.cell(6, 3, 6, 8, true).string(aca_data.AcademicYear).style(topDataStyle)
        ws.cell(7, 3, 7, 8, true).string(aca_data.AcademicGrade).style(topDataStyle)
        ws.cell(8, 3, 8, 8, true).string(aca_data.Department).style(topDataStyle)
        ws.cell(9, 3, 9, 8, true).string(aca_data.Discipline).style(topDataStyle)
        ws.cell(10, 3, 10, 8, true).string(aca_data.BoardMeetingNo).style(topDataStyle)
        ws.cell(11, 3, 11, 8, true).string(aca_data.BoardMeetingDate).style(topDataStyle)
    }
    function TableRegularStudents() {
        var regStud = aca_data.dataTables.RegStudents;
        var ztitle = getTitle('الطلاب النظاميون');
        ws.cell(crow, 2).string(ztitle).style({ font: { bold: true, size: 16 } })
        GenerateACADataTable(ws, crow + 1, aca_data, regStud)
        genRegStudentsFormulae(ws, crow + 3)
        crow += Object.keys(regStud).length + 4;
        genSumFormulae(crow, crow - 11, crow - 1)
        crow += 1
    }
    function TableRegusarStudentsHonours() {
        var regStudHonours = aca_data.dataTables.RegStudentsHonours;
        var vTitle = getTitle('الحاصلون على مرتبة الشرف (نظاميون)')
        ws.cell(crow, 2).string(vTitle).style({ font: { bold: true, size: 16 } })
        GenerateACADataTable(ws, crow + 1, aca_data, regStudHonours)
        genHonStudentsFormulae(ws, crow + 3)
        crow += Object.keys(regStudHonours).length + 4;
        genSumFormulae(crow, crow - 5, crow - 1)
        crow += 1
    }
    function TableExternalStudents() {
        let extStud = aca_data.dataTables.ExtStudents;
        let vTitle = getTitle('الممتحنون من الخارج');
        ws.cell(crow, 2).string(vTitle).style({ font: { bold: true, size: 16 } })
        GenerateACADataTable(ws, crow + 1, aca_data, extStud)
        genExtStudentsFormulae(ws, crow + 3)
        crow += Object.keys(extStud).length + 4;
        genSumFormulae(crow, crow - 7, crow - 1)
        crow += 1
    }
    function TableExternalStudentsHonours() {
        let extStudHonours = aca_data.dataTables.ExtStudentsHonours;
        let vTitle = getTitle('الحاصلون على مرتبة الشرف (خارجيون) ')
        ws.cell(crow, 2).string(vTitle).style({ font: { bold: true, size: 16 } })
        GenerateACADataTable(ws, crow + 1, aca_data, extStudHonours)
        genHonStudentsFormulae(ws, crow + 3)
        crow += Object.keys(extStudHonours).length + 4;
        genSumFormulae(crow, crow - 4, crow - 1)
        crow += 1
    }
    function GraphRegularStuds() {
        let vTitle = getTitle('الرسوم البيانية')
        ws.cell(crow, 2).string(vTitle).style({ font: { bold: true, size: 16 } })
        crow += 1
        genGraph('الطلاب النظاميون', crow, 13, 17, 27)
    }
    function GraphRegularStudsHonours() { genGraph('مرتبة الشرف (نظاميون)', crow, 15, 34, 38) }
    function GraphExternalStudents() { genGraph('الممتحنون من الخارج', crow, 15, 47, 55) }
    function GraphExternalStudHonours() { genGraph('مرتبة الشرف (خارجيون)', crow, 15, 61, 65) }
    function BoardOpinion() {
        let vTitle = getTitle('رأي مجلس الكلية')
        ws.cell(crow, 2).string(vTitle).style({ font: { bold: true, size: 16 } })
        ws.cell(crow + 1, 2, crow + 4, 8, true).style({
            border: {
                left: { style: 'thick', color: 'black' },
                right: { style: 'thick', color: 'black' },
                top: { style: 'thick', color: 'black' },
                bottom: { style: 'thick', color: 'black' }
            }
        })
        crow += 5
    }
    function Signatures() {
        var signStyle = {
            font: { bold: true, size: 14 },
            alignment: { horizontal: 'center', vertical: 'center' }
        };
        let crw = crow + 1
        ws.cell(crw, 2).string(aca_data.RegistrarName).style(signStyle);
        ws.cell(crw, 3, crw, 5, true).string(aca_data.DeputyDeanName).style(signStyle);
        ws.cell(crw, 6, crw, 8, true).string(aca_data.DeanName).style(signStyle);
        ws.cell(crw + 1, 2).string('المسجل').style(signStyle);
        ws.cell(crw + 1, 3, crw + 1, 5, true).string('رئيس لجنة الامتحانات').style(signStyle);
        ws.cell(crw + 1, 6, crw + 1, 8, true).string('العميد').style(signStyle);
        ws.addPageBreak('row', crw + 1);
        crow += 3;
    }
    function genGraph(xtitle, grow, gheight, srow, erow) {
        let ser_cat = `'${sheetName}'!$B$${srow}:$B$${erow}`
        let ser1_vals = `'${sheetName}'!$D$${srow}:$D$${erow}`
        let ser2_vals = `'${sheetName}'!$F$${srow}:$F$${erow}`
        let ser3_vals = `'${sheetName}'!$H$${srow}:$H$${erow}`
        crow += 1
        ws.addChart({
            type: 'chart',
            chartType: 'bar',
            chartData: {
                title: xtitle,
                dataSeries: [
                    { label: 'العام الحالي', pattern: 'solidDmnd', range: ser1_vals, catRange: ser_cat },
                    { label: 'العام السابق', pattern: 'smGrid', range: ser2_vals, catRange: ser_cat },
                    { label: 'العام الأسبق', pattern: 'wdDnDiag', range: ser3_vals, catRange: ser_cat },
                ],
                xlabel: { fontSize: 14, bold: 1, value: 'الوصف', font: { fontSize: 12, bold: 1 } },
                ylabel: { fontSize: 14, bold: 1, value: 'النسبة المئوية' }
            },
            position: {
                type: 'twoCellAnchor',
                from: {
                    col: 2, row: grow, colOff: 48000, rowOff: 48000
                },
                to: {
                    col: 8 + 1, row: grow + gheight + 1, colOff: -24000, rowOff: -96000
                }
            }
        })
        crow += gheight;
    }
}

function GenerateACADataTable(ws, srow, acd, dtab, tabNum) {
    if (true) {
        var xsty = {
            font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                left: { style: 'thin', color: 'black' },
                right: { style: 'thin', color: 'black' },
                top: { style: 'thin', color: 'black' },
                bottom: { style: 'thin', color: 'black' }
            }
        };
        var zsty = {
            font: { bold: true }, alignment: { horizontal: 'right', vertical: 'center' },
            border: {
                left: { style: 'medium', color: 'black' },
                right: { style: 'medium', color: 'black' },
                top: { style: 'thin', color: 'black' },
                bottom: { style: 'thin', color: 'black' }
            }
        };
        var r1sty = {
            font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                left: { style: 'medium', color: 'black' },
                right: { style: 'medium', color: 'black' },
                top: { style: 'medium', color: 'black' },
            }
        };
        var r2sty = {
            font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                left: { style: 'medium', color: 'black' },
                right: { style: 'medium', color: 'black' },
                bottom: { style: 'thin', color: 'black' },
            }
        };
        var r3lsty = {
            font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                left: { style: 'thin', color: 'black' },
                right: { style: 'medium', color: 'black' },
                bottom: { style: 'medium', color: 'black' },
                top: { style: 'thin', color: 'black' },
            }
        };
        var r3rsty = {
            font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                left: { style: 'medium', color: 'black' },
                right: { style: 'thin', color: 'black' },
                bottom: { style: 'medium', color: 'black' },
                top: { style: 'thin', color: 'black' },
            }
        };

        ws.cell(srow, 2, srow + 2, 2, true).string('الوصف').style({
            font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                left: { style: 'medium', color: 'black' },
                right: { style: 'medium', color: 'black' },
                top: { style: 'medium', color: 'black' },
                bottom: { style: 'medium', color: 'black' }
            }
        });

        ws.cell(srow, 3, srow, 4, true).string('العام الدراسي').style(r1sty)
        ws.cell(srow, 5, srow, 6, true).string('العام الدراسي').style(r1sty)
        ws.cell(srow, 7, srow, 8, true).string('العام الدراسي').style(r1sty)

        ws.cell(srow + 1, 3, srow + 1, 4, true).string(acd.AcademicYear).style(r2sty)
        ws.cell(srow + 1, 5, srow + 1, 6, true).string(acd.AcademicYear_M_1).style(r2sty)
        ws.cell(srow + 1, 7, srow + 1, 8, true).string(acd.AcademicYear_M_2).style(r2sty)

        ws.cell(srow + 2, 3).string('العدد').style(r3rsty)
        ws.cell(srow + 2, 4).string('النسبة').style(r3lsty)
        ws.cell(srow + 2, 5).string('العدد').style(r3rsty)
        ws.cell(srow + 2, 6).string('النسبة').style(r3lsty)
        ws.cell(srow + 2, 7).string('العدد').style(r3rsty)
        ws.cell(srow + 2, 8).string('النسبة').style(r3lsty)
    }
    var n = 3;
    for (var label in dtab) {
        var val = dtab[label];
        // console.log(val)
        var zlab = val[3] ? val[3] : label;
        ws.cell(srow + n, 2).string(zlab).style(zsty)
        ws.cell(srow + n, 3).number(val[0]).style(xsty)
        ws.cell(srow + n, 5).number(val[1]).style(xsty)
        ws.cell(srow + n, 7).number(val[2]).style(xsty)
        ws.row(srow + n).height = 16.5;
        n++;
    }
}

function genRegStudentsFormulae(ws, srow) {
    var xsty = {
        font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' },
        border: {
            left: { style: 'thin', color: 'black' },
            right: { style: 'medium', color: 'black' },
            top: { style: 'thin', color: 'black' },
            bottom: { style: 'thin', color: 'black' }
        }
    };
    var hidden_xsty = {
        font: { bold: true, color: 'FFFFFF' },
        border: {
            left: { style: 'thin', color: 'black' },
            right: { style: 'medium', color: 'black' },
            top: { style: 'thin', color: 'black' },
            bottom: { style: 'thin', color: 'black' }
        }
    };


    colsx = [4, 6, 8];
    for (cx of colsx) {
        var rtot = xl.getExcelCellRef(srow + 1, cx - 1);
        var rexam = xl.getExcelCellRef(srow + 2, cx - 1);

        for (let n = 1; n <= 11; n++) {
            var r1 = xl.getExcelCellRef(srow + n, cx - 1);
            if (n == 2 || n == 9) {
                ws.cell(srow + n, cx).formula(`IF(${rtot}=0, 0, ROUND((${r1}/${rtot})*100,2))`).style(xsty)
            } else if (n == 1) {
                ws.cell(srow + n, cx).formula(`IF(${rtot}=0, 0, ROUND((${r1}/${rtot})*100,2))`).style(hidden_xsty)
            } else {
                ws.cell(srow + n, cx).formula(`IF(${rexam}=0, 0, ROUND((${r1}/${rexam})*100,2))`).style(xsty)
            }
        }
    }
}

function genHonStudentsFormulae(ws, srow) {
    var xsty = {
        font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' },
        border: {
            left: { style: 'thin', color: 'black' },
            right: { style: 'medium', color: 'black' },
            top: { style: 'thin', color: 'black' },
            bottom: { style: 'thin', color: 'black' }
        }
    };
    var hidden_xsty = {
        font: { bold: true, color: 'FFFFFF' },
        border: {
            left: { style: 'thin', color: 'black' },
            right: { style: 'medium', color: 'black' },
            top: { style: 'thin', color: 'black' },
            bottom: { style: 'thin', color: 'black' }
        }
    };

    colsx = [4, 6, 8];
    for (cx of colsx) {
        var rtot = xl.getExcelCellRef(srow + 1, cx - 1);
        for (let n = 1; n <= 5; n++) {
            var r1 = xl.getExcelCellRef(srow + n, cx - 1);
            if (n == 1) {
                ws.cell(srow + n, cx).formula(`IF(${rtot}=0, 0, ROUND((${r1}/${rtot})*100,2))`).style(hidden_xsty)
            } else {
                ws.cell(srow + n, cx).formula(`IF(${rtot}=0, 0, ROUND((${r1}/${rtot})*100,2))`).style(xsty)
            }
        }
    }
}

function genExtStudentsFormulae(ws, srow) {
    var xsty = {
        font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' },
        border: {
            left: { style: 'thin', color: 'black' },
            right: { style: 'medium', color: 'black' },
            top: { style: 'thin', color: 'black' },
            bottom: { style: 'thin', color: 'black' }
        }
    };
    var hidden_xsty = {
        font: { bold: true, color: 'FFFFFF' },
        border: {
            left: { style: 'thin', color: 'black' },
            right: { style: 'medium', color: 'black' },
            top: { style: 'thin', color: 'black' },
            bottom: { style: 'thin', color: 'black' }
        }
    };

    colsx = [4, 6, 8];
    for (cx of colsx) {
        var rtot = xl.getExcelCellRef(srow + 1, cx - 1);
        var rexam = xl.getExcelCellRef(srow + 2, cx - 1);

        for (let n = 1; n <= 9; n++) {
            var r1 = xl.getExcelCellRef(srow + n, cx - 1);
            if (n == 2) {
                ws.cell(srow + n, cx).formula(`IF(${rtot}=0, 0, ROUND((${r1}/${rtot})*100,2))`).style(xsty)
            } else if (n == 1) {
                ws.cell(srow + n, cx).formula(`IF(${rtot}=0, 0, ROUND((${r1}/${rtot})*100,2))`).style(hidden_xsty)
            } else {
                ws.cell(srow + n, cx).formula(`IF(${rexam}=0, 0, ROUND((${r1}/${rexam})*100,2))`).style(xsty)
            }
        }
    }
}

module.exports = genAcaSmrySheet;
function processRecommendation(xdata) {
    for (res of xdata) {
        var YearId = res.YearId;
        var GradeId = res.GradeId;
        var SemesterId = res.SemesterId;

        var crsList = res.Courses;
        for (st of res.MarksData) {
            var process_result = processSingleStudent(st, crsList, YearId, GradeId, SemesterId);
        }
    }
}

function processSingleStudent(st, crsList, YearId, GradeId, SemesterId) {
    var nSubjects;
    var nFs=0; var nDs=0; var nABs=0; var nUnexcused=0;
    var suppFs=0; var suppDs=0; var suppABs=0;
    var yrec; var crec;
    var comment;
    var prevCGPA = calcPreviousCGPA(st, GradeId);

    var grTotList = crsList.map(crs => {
        var cid = crs.CourseId;
        var ex = st[cid + "-EX"]
        var cw = st[cid + "-CW"]
        var pr = st[cid + "-PR"]
        var ec = st[cid + "-EC"]
        if (ex === null && cw === null && pr === null && ec === null) {
            var mkg = { total: undefined, grade: 'NT' };
        } else {
            var mkg = AssignGrade(ex, cw, pr, ec, crs.CourseworkFraction, crs.ExamFraction)
            nSubjects += 1;
            if (mkg.grade.startsWith('F')) nFs += 1;
            if (mkg.grade.startsWith('D')) nDs += 1;
            if (mkg.grade.startsWith('AB')) nABs += 1;
            if (pr == 0 && ex == 0) nUnexcused += 1;
        }
        return mkg;
    });

    if (st.countABs !== nABs) throw new Error('Problem with computing the number of absences');

    function NiceYRecomm() {
        if (st.GPA >= 7.0) yrec = "I";
        else if (st.GPA >= 6.0) yrec = "II";
        else if (st.GPA >= 4.3) yrec = "III";
        else if (st.GPA >= 3.5 && st.GPA < 4.3) yrec = "Repeat";
        else yrec = "Dismiss";
    }

    function NiceCRecomm() {
        if (prevCGPA >= 4.3 && prevCGPA < 4.5 && st.CGPA < 4.5) { crec = "Repeat"; comment = 'FG10.3'; }
        else if (st.CGPA >= 4.3 && st.CGPA < 4.5) { crec = "WGPA"; comment = 'FG8.2'; }
        else if (yrec == 'I' || yrec == 'II' || yrec == 'III') {
            let ocgpa = st.CGPA.toFixed(2);
            if (ocgpa >= 7.0) crec = 'I';
            else if (ocgpa >= 6.5) crec = 'II-1';
            else if (ocgpa >= 5.7) crec = 'II-2';
            else if (ocgpa >= 4.5) crec = 'III';
        } else {
            crec = yrec;
        }
    }

    // AR_13_5()
    function AR_13_5() {
        if (nABs == 0)
            return;
        var maxGPA = computeMaxGPA();
        var minGPA = computeMinGPA();

        if (st.GPA === null) {
            if ((nFs + nDs) == 0) {
                yrec = "Subs"; comment = `Sub ${nABs}`;
            }
            else if ((nFs + nDs) <= Math.ceil(nSubjects / 3) && maxGPA >= 4.3) {
                yrec = "SubsSupp"; comment = `Sub ${nABs} + Supp ${nFs + nDs}`;
            }
            else if ((nFs + nDs) == (Math.ceil(nSubjects / 3) + 1) && (nDs >= 1) && maxGPA >= 4.3) {
                yrec = "SubsSupp"; comment = `Sub ${nABs} + Supp ${nFs + nDs}`;
            }
            else if (maxGPA < 3.5) {
                yrec = "Dismiss"; comment = "11.a maxGPA < 3.5";
            }
            else if (maxGPA < 4.3) {
                yrec = "Repeat"; comment = "9.1a cannot sit for Suppp maxGPA < 4.3";
            }
            else if ((nFs + nDs) > Math.ceil(nSubjects / 3)) {
                yrec = "Repeat"; comment = "9.1b cannot sit for Supp nFs > nCrs/3";
            } else {
                yrec = 'Unknown'; comment = '13.5 No rule applies';
            }
        } else {
            yrec = 'Unknown'; comment = 'Cannot have GPA with nABs > 0';
        }
    }

    //AR_11_a()
    function AR_11_a() {
        if (st.GPA < 3.5) {
            yrec = "Dismiss"; comment += `11.a`;
        }
    }
    //AR_11_f()
    function AR_11_f() {
        if (nUnexcused > (nSubjects / 3)) {
            yrec = "Dismiss"; comment += '11.f';
        }
    }

    //AR_8_1()
    function AR_8_1() {
        if (nFs == 0 && nDs == 0 && st.GPA >= 4.5) {
            NiceYRecomm();
            NiceCRecomm();
        }
    }
    //AR_8_2()
    function AR_8_2() {
        if ((st.CGPA != null) && ((4.3 <= st.CGPA) && (st.CGPA < 4.5) && (nFs == 0) && (nDs == 0))) {
            NiceYRecomm();
            crec = "WGPA";
            comment = "FG8.2";
        }
    }
    //AR_8_3()
    function AR_8_3() {
        if (nFs == 0 && nDs == 1 && st.GPA >= 4.5) {
            NiceYRecomm();
            NiceCRecomm();
            comment += "FG8.3";
        }
    }

    //AR_9_1()
    function AR_9_1() {
        if ((st.GPA >= 4.3) && ((nFs + nDs) > 0) && ((nFs + nDs) <= Math.ceil(nSubjects / 3)) &&
            !(nFs == 0 && nDs == 1 && st.GPA >= 4.5)) {
            yrec = 'Supp'; crec = 'Supp'; comment = `Supp ${nFs + nDs}`;
        }
    }
    //AR_9_2()
    function AR_9_2() {
        if ((st.GPA >= 4.5) && ((nFs + nDs) == Math.ceil(nSubjects / 3) + 1) && (nDs >= 1)) {
            yrec = "MultiD"; crec = "MultiD"; comment = `Supp ${nFs + nDs - 1} + D`;
        }
    }

    //AR_10_1()
    function AR_10_1() {
        if (st.GPA >= 3.5 && st.GP < 4.3 && nFs == 0 && nDs == 0) {
            yrec = "Repeat"; crec = "Repeat"; comment += "FG10.1";
        }
    }
    //AR_10_2()
    function AR_10_2() {
        if (st.GPA >= 3.5 && ((nFs + nDs) > Math.ceil(nSubjects/3)) && !(yrec == 'MultiD')){
            yrec = "Repeat"; crec = "Repeat"; comment += "FG10.2";
        }
    }
    //AR_10_3()
    function AR_10_3() {
        if (prevCGPA >= 4.3 && prevCGPA < 4.5 && st.CGPA < 4.5){
            yrec = "Repeat"; crec = "Repeat"; comment += "FG10.3";
        }
    }
    //AR_10_8()
    function AR_10_8() {
        if (st.GPA >= 3.5 && st.GPA < 4.3 && ((nFs + nDs) <= Math.ceil(nSubjects/3)) ){
            yrec = "Repeat"; crec = "Repeat"; comment += "Mhnd/Mhmd AlBushra Case";
        }
    }
    //AR_11_c_10_6()
    function AR_11_c_10_6() {

    }
    //AR_11_d()
    function AR_11_d() {

    }
    //AR_11_e()
    function AR_11_e() {

    }
    //AR_14_4()
    function AR_14_4() {

    }

    //If Not YRec.HasValue Then
    //    YRec = RecommTypeEnum.Unknown
    //End If
    if (yrec == null) {
        yrec = 'Unknown';
    }

    //'External Students Recommendation Post Processing. Should Receive either PASS, FAIL or Sub/Supp/SubSupp
    //AR_14_6()
    function AR_14_6() {

    }

    console.log(grTotList);
    process.exit()
}

function calcPreviousCGPA(st, GradeId) {
    if (GradeId == 2) return (st.GPA1) / 1;
    if (GradeId == 3) return (st.GPA1 + st.GPA2) / 3;
    if (GradeId == 4) return (st.GPA1 + st.GPA2 + st.GPA3) / 6;
    if (GradeId == 5) return (st.GPA1 + st.GPA2 + st.GPA3 + st.GPA4) / 10;
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

module.exports = processRecommendation;
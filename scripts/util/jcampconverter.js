// Define as an amd module
define(function() {

    // the following RegExp can only be used for XYdata, some peakTables have values with a "E-5" ...
    var xyDataSplitRegExp=/[,\t \+-]*(?=[^\d,\t \.])|[ \t]+(?=[\d+\.-])/;
    var removeCommentRegExp=/\$\$.*/;
    var peakTableSplitRegExp=/[,\t ]+/
    var DEBUG=false;

    function convertToFloatArray(stringArray) {
        var floatArray=[];
        for (var i=0, ii = stringArray.length; i<ii; i++) {
            floatArray[i]=parseFloat(stringArray[i]);
        }
        return floatArray;
    };

    function convert(jcamp, options) {
        var ntuples={},
            ldr,
            dataLabel,
            dataValue,
            ldrs,
            i, ii, position, endLine, infos;

        var result={};
        var spectra = [];
        result.spectra=spectra;
        result.info={};
        var spectrum = {};

        if (! (typeof jcamp == "string")) return result;
       // console.time("start");

        ldrs=jcamp.split(/[\r\n]+ *##/);
        if (ldrs[0]) ldrs[0]=ldrs[0].replace(/^[\r\n ]*##/,"");

        for (i=0, ii=ldrs.length; i<ii; i++) {
            ldr=ldrs[i];
            // This is a new LDR
            position=ldr.indexOf("=");
            if (position>0) {
                dataLabel=ldr.substring(0,position);
                dataValue=ldr.substring(position+1).trim();
            } else {
                dataLabel=ldr;
                dataValue="";
            }
            dataLabel=dataLabel.replace(/[_ -]/g,'').toUpperCase();

            if (dataLabel=='DATATABLE') {
                endLine=dataValue.indexOf("\n");
                if (endLine==-1) endLine=dataValue.indexOf("\r");
                if (endLine>0) {
                    var xIndex=-1;
                    var yIndex=-1;
                    // ##DATA TABLE= (X++(I..I)), XYDATA
                    // We need to find the variables

                    infos=dataValue.substring(0,endLine).split(/[ ,;\t]+/);

                    if (infos[0].indexOf("++")>0) {
                        var firstVariable=infos[0].replace(/.*\(([a-zA-Z0-9]+)\+\+.*/,"$1");
                        var secondVariable=infos[0].replace(/.*\.\.([a-zA-Z0-9]+).*/,"$1");
                        xIndex=ntuples.symbol.indexOf(firstVariable);
                        yIndex=ntuples.symbol.indexOf(secondVariable);
                    }

                    if (xIndex==-1) xIndex=0;
                    if (yIndex==-1) yIndex=0;

                    if (ntuples.first) {
                        if (ntuples.first.length>xIndex) spectrum.firstX=ntuples.first[xIndex];
                        if (ntuples.first.length>yIndex) spectrum.firstY=ntuples.first[yIndex];
                    }
                    if (ntuples.last) {
                        if (ntuples.last.length>xIndex) spectrum.lastX=ntuples.last[xIndex];
                        if (ntuples.last.length>yIndex) spectrum.lastY=ntuples.last[yIndex];
                    }
                    if (ntuples.vardim && ntuples.vardim.length>xIndex) {
                        spectrum.nbPoints=ntuples.vardim[xIndex];
                    }
                    if (ntuples.factor) {
                        if (ntuples.factor.length>xIndex) spectrum.xFactor=ntuples.factor[xIndex];
                        if (ntuples.factor.length>yIndex) spectrum.yFactor=ntuples.factor[yIndex];
                    }
                    if (ntuples.units) {
                        if (ntuples.units.length>xIndex) spectrum.xUnit=ntuples.units[xIndex];
                        if (ntuples.units.length>yIndex) spectrum.yUnit=ntuples.units[yIndex];
                    }
                    
                    spectrum.datatable=infos[0];
                    if (infos[1] && infos[1].indexOf("PEAKS")>-1) {
                        dataLabel="PEAKTABLE";
                    } else if (infos[1] && (infos[1].indexOf("XYDATA") || infos[0].indexOf("++")>0)) {
                        dataLabel="XYDATA";
                        spectrum.deltaX=(spectrum.lastX-spectrum.firstX)/(spectrum.nbPoints-1);
                    }
                }
            }


            if (dataLabel=='TITLE') {
                spectrum.title = dataValue;
            } else if (dataLabel=='DATATYPE') {
                if (dataValue.indexOf("nD")>-1) {
                    result.twoD = true;
                }
            } else if (dataLabel=='XUNITS') {
                spectrum.xUnit = dataValue;
            } else if (dataLabel=='YUNITS') {
                spectrum.yUnit = dataValue;
            } else if (dataLabel=='FIRSTX') {
                spectrum.firstX = parseFloat(dataValue);
            } else if (dataLabel=='LASTX') {
                spectrum.lastX = parseFloat(dataValue);
            } else if (dataLabel=='FIRSTY') {
                spectrum.firstY = parseFloat(dataValue);
            } else if (dataLabel=='NPOINTS') {
                spectrum.nbPoints = parseFloat(dataValue);
            } else if (dataLabel=='XFACTOR') {
                spectrum.xFactor = parseFloat(dataValue);
            } else if (dataLabel=='YFACTOR') {
                spectrum.yFactor = parseFloat(dataValue);
            } else if (dataLabel=='DELTAX') {
                spectrum.deltaX = parseFloat(dataValue);
            } else if (dataLabel=='.OBSERVEFREQUENCY' || dataLabel=='$SFO1') {
                if (!spectrum.observeFrequency) spectrum.observeFrequency=parseFloat(dataValue);
            } else if (dataLabel=='.OBSERVENUCLEUS') {
                if (!spectrum.xType) result.xType=dataValue.replace(/[^a-zA-Z0-9]/g,"");
            } else if (dataLabel=='$SFO2') {
                if (!result.indirectFrequency) result.indirectFrequency=parseFloat(dataValue);
            } else if (dataLabel=='$OFFSET') {   // OFFSET for Bruker spectra
                shiftOffsetNum = 0;
                shiftOffsetVal = parseFloat(dataValue);
            } else if (dataLabel=='$REFERENCEPOINT') {   // OFFSET for Varian spectra
        

            } else if (dataLabel=='.SHIFTREFERENCE') {   // OFFSET FOR Bruker Spectra
                    var parts = dataValue.split(/ *, */);
                    shiftOffsetNum = parseInt(parts[2].trim());
                    shiftOffsetVal = parseFloat(parts[3].trim());
            } else if (dataLabel=='VARNAME') {
                ntuples.varname=dataValue.split(/[, \t]+/);
            } else if (dataLabel=='SYMBOL') {
                ntuples.symbol=dataValue.split(/[, \t]+/);
            } else if (dataLabel=='VARTYPE') {
                ntuples.vartype=dataValue.split(/[, \t]+/);
            } else if (dataLabel=='VARFORM') {
                ntuples.varform=dataValue.split(/[, \t]+/);
            } else if (dataLabel=='VARDIM') {
                ntuples.vardim=convertToFloatArray(dataValue.split(/[, \t]+/));
            } else if (dataLabel=='UNITS') {
                ntuples.units=dataValue.split(/[, \t]+/);
            } else if (dataLabel=='FACTOR') {
                ntuples.factor=convertToFloatArray(dataValue.split(/[, \t]+/));
            } else if (dataLabel=='FIRST') {
                ntuples.first=convertToFloatArray(dataValue.split(/[, \t]+/));
            } else if (dataLabel=='LAST') {
                ntuples.last=convertToFloatArray(dataValue.split(/[, \t]+/));
            } else if (dataLabel=='MIN') {
                ntuples.min=convertToFloatArray(dataValue.split(/[, \t]+/));
            } else if (dataLabel=='MAX') {
                ntuples.max=convertToFloatArray(dataValue.split(/[, \t]+/));
            } else if (dataLabel=='.NUCLEUS') {
                if (result.twoD) {
                    result.yType=dataValue.split(/[, \t]+/)[0];
                }
            } else if (dataLabel=='PAGE') {
                spectrum.page=dataValue.trim();
                spectrum.pageValue=parseFloat(dataValue.replace(/^.*=/,""));
                if (result.indirectFrequency) {
                    spectrum.pageValue/=result.indirectFrequency;
                }
            } else if (dataLabel=="XYDATA") {
                prepareSpectrum(spectrum);
                parseXYData(spectrum, dataValue);
                spectra.push(spectrum);
                spectrum={};
            } else if (dataLabel=="PEAKTABLE") {
                prepareSpectrum(spectrum);
                parsePeakTable(spectrum, dataValue);
                spectra.push(spectrum);
                spectrum={};
            } else if (dataLabel.match(/^[A-Z].*/)) {
                result.info[dataLabel]=dataValue.trim();
            }
        }

        // Currently disabled
    //    if (options && options.lowRes) addLowRes(spectra,options);

        if (result.twoD) {
            add2D(result);
        }
    //  console.log(result);
    //    console.log(JSON.stringify(spectra));
        return result;

    }


    function prepareSpectrum(spectrum) {
        if (! spectrum.xFactor) spectrum.xFactor=1;
        if (! spectrum.yFactor) spectrum.yFactor=1;
        if (spectrum.observeFrequency) {
            if (spectrum.xUnit && spectrum.xUnit.toUpperCase()=='HZ') {
                spectrum.xUnit='PPM';
            } else {
                spectrum.observeFrequency=1;
            }
        }
    }

    function parsePeakTable(spectrum, value) {
        var i,ii,j,jj,values;
        spectrum.data=[];
        spectrum.currentData=[];
        spectrum.data.push(spectrum.currentData);
        var lines=value.split(/,? *,?[;\r\n]+ */);


        for (i=1, ii=lines.length; i<ii; i++) {
            values=lines[i].trim().replace(removeCommentRegExp,"").split(peakTableSplitRegExp);
            if (values.length%2==0) {
                for (j=0,jj=values.length; j<jj; j=j+2) {
                    spectrum.currentData.push(parseFloat(values[j]*spectrum.xFactor));
                    spectrum.currentData.push(parseFloat(values[j+1]*spectrum.yFactor));
                }
                
            } else {
                console.log("Format error: "+values);
            }
        }
        delete spectrum.currentData;
    }

    function parseXYData(spectrum, value) {
        // we check if deltaX is defined otherwise we calculate it
        if (! spectrum.deltaX) {
            spectrum.deltaX=(spectrum.lastX-spectrum.firstX)/(spectrum.nbPoints-1);
        }

        spectrum.data=[];
        spectrum.currentData=[];
        spectrum.data.push(spectrum.currentData);
        var currentX = spectrum.firstX;
        var currentY = spectrum.firstY;
        var lines=value.split(/[\r\n]+/);
        var lastDif, values, ascii, expectedY;
        values=[];
        for (var i=1, ii=lines.length; i<ii; i++) {
            var previousValues=JSON.parse(JSON.stringify(values));
            values=lines[i].trim().replace(removeCommentRegExp,"").split(xyDataSplitRegExp);
            if (values.length>0) {
                if (DEBUG) {
                    if (! spectrum.firstPoint) {
                        spectrum.firstPoint=parseFloat(values[0]);
                    }
                    var expectedCurrentX=parseFloat(values[0]-spectrum.firstPoint)*spectrum.xFactor+spectrum.firstX;
                    if ((lastDif || lastDif==0)) {
                        expectedCurrentX+=spectrum.deltaX;
                    }
                    console.log("Checking X value: currentX: "+currentX+" - expectedCurrentX: "+expectedCurrentX);
                    console.log(values);
                }

                
                for (var j=1, jj=values.length; j<jj; j++) {
                    if (j==1 && (lastDif || lastDif==0)) {
                        lastDif = undefined; // at the beginning of each line there should be the full value X / Y so the diff is always undefined
                        // we could check if we have the expected Y value
                        ascii=values[j].charCodeAt(0);
                        
                        if (false) { // this code is just to check the jcamp DIFDUP and the next line repeat of Y value
                            // + - . 0 1 2 3 4 5 6 7 8 9
                            if ((ascii==43) || (ascii==45) || (ascii==46) || ((ascii>47) && (ascii<58))) {
                                expectedY=parseFloat(values[j]);
                            } else
                            // positive SQZ digits @ A B C D E F G H I (ascii 64-73)
                            if ((ascii>63) && (ascii<74)) {
                                expectedY=parseInt(String.fromCharCode(ascii-16)+values[j].substring(1));
                            } else
                            // negative SQZ digits a b c d e f g h i (ascii 97-105)
                            if ((ascii>96) && (ascii<106)) {
                                expectedY=- parseInt(String.fromCharCode(ascii-48)+values[j].substring(1));
                           }
                           if (expectedY!=currentY) {
                                console.log("Y value check error: Found: "+expectedY+" - Current: "+currentY);
                                console.log("Previous values: "+previousValues.length);
                                console.log(previousValues);
                           }
                       }
                    } else {
                        if (values[j].length>0) {
                            ascii=values[j].charCodeAt(0);
                            // + - . 0 1 2 3 4 5 6 7 8 9
                            if ((ascii==43) || (ascii==45) || (ascii==46) || ((ascii>47) && (ascii<58))) {
                                lastDif=undefined;
                                currentY=parseFloat(values[j]);
                                addPoint(spectrum,currentX,currentY);
                                currentX+=spectrum.deltaX;
                            } else
                            // positive SQZ digits @ A B C D E F G H I (ascii 64-73)
                            if ((ascii>63) && (ascii<74)) {
                                lastDif=undefined;
                                currentY=parseInt(String.fromCharCode(ascii-16)+values[j].substring(1));
                                addPoint(spectrum,currentX,currentY);
                                currentX+=spectrum.deltaX;
                            } else
                            // negative SQZ digits a b c d e f g h i (ascii 97-105)
                            if ((ascii>96) && (ascii<106)) {
                                lastDif=undefined;
                                currentY=-parseInt(String.fromCharCode(ascii-48)+values[j].substring(1));
                                addPoint(spectrum,currentX,currentY);
                                currentX+=spectrum.deltaX;
                           } else 



                            // DUP digits S T U V W X Y Z s (ascii 83-90, 115)
                            if  (((ascii>82) && (ascii<91)) || (ascii==115)) {
                                var dup = parseInt(String.fromCharCode(ascii-34)+values[j].substring(1))-1;
                                if (ascii==115) {
                                    dup = parseInt("9"+values[j].substring(1))-1;
                                }
                                for ( var l=0; l<dup; l++) {
                                    if (lastDif) {
                                        currentY=currentY+lastDif;
                                    }
                                    addPoint(spectrum,currentX,currentY);
                                    currentX+=spectrum.deltaX;
                                }
                            } else
                            // positive DIF digits % J K L M N O P Q R (ascii 37, 74-82)
                            if  (ascii==37) {
                                lastDif=parseInt("0"+values[j].substring(1));
                                currentY+=lastDif;
                                addPoint(spectrum,currentX,currentY);
                                currentX+=spectrum.deltaX;
                            } else if ((ascii>73) && (ascii<83)) {
                                lastDif=parseInt(String.fromCharCode(ascii-25)+values[j].substring(1));
                                currentY+=lastDif;
                                addPoint(spectrum,currentX,currentY);
                                currentX+=spectrum.deltaX;
                           } else
                            // negative DIF digits j k l m n o p q r (ascii 106-114)
                            if ((ascii>105) && (ascii<115)) {
                                lastDif=-parseInt(String.fromCharCode(ascii-57)+values[j].substring(1));
                                currentY+=lastDif;
                                addPoint(spectrum,currentX,currentY);
                                currentX+=spectrum.deltaX;
                           }
                        }
                    }
                }  
            }
        }


        function addPoint(spectrum,currentX,currentY) {
            // if (aa++<10) console.log(currentX+" - "+currentY+" - "+currentX/spectrum.observeFrequency+" - "+currentY*spectrum.yFactor);
            if (spectrum.observeFrequency) {

                spectrum.currentData.push(currentX/spectrum.observeFrequency, currentY*spectrum.yFactor);
            } else {
                spectrum.currentData.push(currentX, currentY*spectrum.yFactor);
            }
        }
        delete spectrum.currentData;
    }

    function convertTo3DZ(spectra) {
        //console.time("ConvertTo3DZ");
        var z=[];
        var noise=0;
        var minZ=spectra[0].data[0][0];
        var maxZ=spectra[0].data[0][0];
        var ySize=spectra.length;
        var xSize=spectra[0].data[0].length/2;
        for (var i=0; i<ySize; i++) {
            z[i]=[];
            for (var j=0; j<xSize; j++) {
                z[i][j]=spectra[i].data[0][j*2+1];
                if (z[i][j]<minZ) minZ=spectra[i].data[0][j*2+1];
                if (z[i][j]>maxZ) maxZ=spectra[i].data[0][j*2+1];
                if (i!=0 && j!=0) {
                    noise += Math.abs(z[i][j] - z[i][j-1])+Math.abs(z[i][j] - z[i-1][j]);
                }
            }
        }
        //console.timeEnd("ConvertTo3DZ");
        return {
            z: z, 
            minX: spectra[0].data[0][0], 
            maxX: spectra[0].data[0][spectra[0].data[0].length-2],
            minY: spectra[0].pageValue, 
            maxY: spectra[spectra.length-1].pageValue,
            minZ: minZ,
            maxZ: maxZ,
            noise: noise/((z.length-1)*(z[0].length-1)*2)
        };
       
    }

    function add2D(result) {
        var zData=convertTo3DZ(result.spectra);
        result.contourLines=generateContourLines(zData);
        delete zData.z;
        result.minMax=zData;
    }

 

    function generateContourLines(zData) {
        //console.time("generateContourLines");
        var noise=zData.noise;
        var z=zData.z;
        var contourLevels=[];
        var nbLevels=7;
        var povarHeight = new Float32Array(4);
        var isOver = [];
        var nbSubSpectra=z.length;
        var nbPovars=z[0].length;
        var pAx, pAy, pBx, pBy;

        var x0 = zData.minX;
        var xN = zData.maxX;
        var dx = (xN - x0) / (nbPovars-1);
        var y0 = zData.minY;
        var yN = zData.maxY;
        var dy = (yN - y0) / (nbSubSpectra-1);
        var minZ=zData.minZ;
        var maxZ=zData.maxZ;

        //System.out.prvarln("y0 "+y0+" yN "+yN);
        // -------------------------
        // Povars attribution
        //
        // 0----1
        // |  / |
        // | /  |
        // 2----3
        //
        // ---------------------d------

        var lineZValue;
        for (var level = 0; level < nbLevels*2; level++) { // multiply by 2 for positif and negatif
            var contourLevel={};
            contourLevels.push(contourLevel);
            var side=level%2;
            if (side==0) {
                lineZValue=(maxZ - 5 * noise) * Math.exp(level/2 - nbLevels) + 5 * noise;
            } else {
                lineZValue=-(maxZ - 5 * noise) * Math.exp(level/2 - nbLevels) - 5 * noise;
            }
            var lines=[];
            contourLevel.zValue=lineZValue;
            contourLevel.lines=lines;

            if (lineZValue <= minZ || lineZValue >= maxZ) continue;
            
            for (var iSubSpectra = 0; iSubSpectra < nbSubSpectra - 1; iSubSpectra++) {
                for (var povar = 0; povar < nbPovars - 1; povar++) {
                    povarHeight[0] = z[iSubSpectra][povar];
                    povarHeight[1] = z[iSubSpectra][povar + 1];
                    povarHeight[2] = z[(iSubSpectra + 1)][povar];
                    povarHeight[3] = z[(iSubSpectra + 1)][(povar + 1)];

                    for (var i = 0; i < 4; i++) {
                        isOver[i] = (povarHeight[i] > lineZValue);
                    }

                    // Example povar0 is over the plane and povar1 and
                    // povar2 are below, we find the varersections and add
                    // the segment
                    if (isOver[0] != isOver[1] && isOver[0] != isOver[2]) {
                        pAx = povar + (lineZValue - povarHeight[0]) / (povarHeight[1] - povarHeight[0]);
                        pAy = iSubSpectra;
                        pBx = povar;
                        pBy = iSubSpectra + (lineZValue - povarHeight[0]) / (povarHeight[2] - povarHeight[0]);
                        lines.push(pAx * dx + x0, pAy * dy + y0, pBx * dx + x0, pBy * dy + y0);
                    }
                    if (isOver[3] != isOver[1] && isOver[3] != isOver[2]) {
                        pAx = povar + 1;
                        pAy = iSubSpectra + 1 - (lineZValue - povarHeight[3]) / (povarHeight[1] - povarHeight[3]);
                        pBx = povar + 1 - (lineZValue - povarHeight[3]) / (povarHeight[2] - povarHeight[3]);
                        pBy = iSubSpectra + 1;
                        lines.push(pAx * dx + x0, pAy * dy + y0, pBx * dx + x0, pBy * dy + y0);
                    }
                    // test around the diagonal
                    if (isOver[1] != isOver[2]) {
                        pAx = povar + 1 - (lineZValue - povarHeight[1]) / (povarHeight[2] - povarHeight[1]);
                        pAy = iSubSpectra + (lineZValue - povarHeight[1]) / (povarHeight[2] - povarHeight[1]);
                        if (isOver[1] != isOver[0]) {
                            pBx = povar + 1 - (lineZValue - povarHeight[1]) / (povarHeight[0] - povarHeight[1]);
                            pBy = iSubSpectra;
                            lines.push(pAx * dx + x0, pAy * dy + y0, pBx * dx + x0, pBy * dy + y0);
                        }
                        if (isOver[2] != isOver[0]) {
                            pBx = povar;
                            pBy = iSubSpectra + 1 - (lineZValue - povarHeight[2]) / (povarHeight[0] - povarHeight[2]);
                            lines.push(pAx * dx + x0, pAy * dy + y0, pBx * dx + x0, pBy * dy + y0);
                        }
                        if (isOver[1] != isOver[3]) {
                            pBx = povar + 1;
                            pBy = iSubSpectra + (lineZValue - povarHeight[1]) / (povarHeight[3] - povarHeight[1]);
                            lines.push(pAx * dx + x0, pAy * dy + y0, pBx * dx + x0, pBy * dy + y0);
                        }
                        if (isOver[2] != isOver[3]) {
                            pBx = povar + (lineZValue - povarHeight[2]) / (povarHeight[3] - povarHeight[2]);
                            pBy = iSubSpectra + 1;
                            lines.push(pAx * dx + x0, pAy * dy + y0, pBx * dx + x0, pBy * dy + y0);
                        }
                    }
                }
            }
        }
        // console.timeEnd("generateContourLines");
        return contourLevels;
    }


    function addLowRes(spectra, options) {
        var spectrum;
        var averageX, averageY;
        var targetNbPoints=options.lowRes;
        var highResData;
        for (var i=0; i<spectra.length; i++) {
            spectrum=spectra[i];
            // we need to find the current higher resolution
            if (spectrum.data.length>0) {
                highResData=spectrum.data[0];
                for (var j=1; j<spectrum.data.length; j++) {
                    if (spectrum.data[j].length>highResData.length) {
                        highResData=spectrum.data[j];
                    }
                }

                if (targetNbPoints>(highResData.length/2)) return;
                var i, ii;
                var lowResData=[];
                var modulo=Math.ceil(highResData.length/(targetNbPoints*2));
                for (i=0, ii=highResData.length; i<ii; i=i+2) {
                    if (i%modulo==0) {
                        lowResData.push(highResData[i], highResData[i+1])
                    }
                }
                spectrum.data.push(lowResData);
            }
        }
    }

    return convert;
});
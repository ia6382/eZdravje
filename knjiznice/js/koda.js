
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}

var ehrIdPrvi;
var ehrIdDrugi;
var ehrIdTretji;
var aliPrvi = 0;
var aliDrugi = 0;
var aliTretji = 0;

var meritve1 = [[130,133,132,140,130,130,135,128],[110,112,108,115,120,121,116,114],[140,144,145,143,150,148,151,140]];
var meritve2 = [[80,81,82,83,80,79,80,78],[60,62,64,60,67,70,66,64],[100,95,97,94,102,100,99,97]];

/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
 
var ehrId;
function generirajPodatke(stPacienta) {
    if(stPacienta == 1){
        aliPrvi = 1;
    }
    else if(stPacienta == 2){
        aliDrugi = 1;
    }
    else{
        aliTretji = 1;
    }
    ehrId = "";

    naredibolnika(stPacienta, function(){
        for(var i = 0;i < 8;i ++){
            dodajPodatke(stPacienta, i, function(){
                if(i == 8){ 
                    $("#GenerirajSporocilo").html("<span class='obvestilo "+"label label-default'>Uspešno generiran bolnik "+stPacienta+".</span>").fadeOut(10000);
                }
            });
        }
    });
    
  return ehrId;
}

function naredibolnika(stPacienta, callback){
    var sessionId = getSessionId();
    
    $.ajaxSetup({
        headers: {
        "Ehr-Session": sessionId
        }
    });
    
    $.ajax({
        url: baseUrl + "/ehr",
        type: 'POST',
        success: function (data) {
            ehrId = data.ehrId;
            
            if(stPacienta == 1){
                ehrIdPrvi = ehrId;
            }
            else if(stPacienta == 2){
                ehrIdDrugi = ehrId;
            }
            else{
                ehrIdTretji = ehrId;
            }
            
            // build party data
            var partyData = {
                firstNames: "Bolnik"+stPacienta,
                lastNames: "Priimek",
                dateOfBirth: "1996-6-14T19:30",
                partyAdditionalInfo: [
                    {
                        key: "ehrId",
                        value: ehrId
                    }
                ]
            };
            
            $.ajax({
                url: baseUrl + "/demographics/party",
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(partyData),
                success: function (party) {
                    if (party.action == 'CREATE') {
    		            console.log("Uspešno kreiran EHR '" + ehrId + "'.");
    		            callback();
                    }
                }
            });
        }
    });
}

function dodajPodatke(stPacienta, i, callback){
    
    var compositionData = {
        "ctx/time": "2016-6-2T"+(8+2*i)+":"+00+"Z",
        "ctx/language": "en",
        "ctx/territory": "SI",
        "vital_signs/blood_pressure/any_event/systolic": meritve1[stPacienta-1][i],
        "vital_signs/blood_pressure/any_event/diastolic": meritve2[stPacienta-1][i]
    };
    
    var sessionId = getSessionId();
    $.ajaxSetup({
        headers: {
        "Ehr-Session": sessionId
        }
    });
    
    var queryParams = {
        "ehrId": ehrId,
        templateId: 'Vital Signs',
        format: 'FLAT',
        committer: 'Belinda Nurse'
    };
        
    $.ajax({
        url: baseUrl + "/composition?" + $.param(queryParams),
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(compositionData),
        success: function (res) {
            callback();
        }
    });
}

function izberiEhrId() {
	var elem;
	var bolnik = $('#preberiEhrIdZaVitalneZnake').val();
	if (bolnik == "1"){
	    elem = document.getElementById("meritveVitalnihZnakovEHRid");
        if(aliPrvi == 1){
            elem.value = ehrIdPrvi;
        }
        else{
            elem.value = "a8fcac46-839c-440d-88fc-eed38d52ea33";
        }
	}
	if (bolnik == "2"){
	    elem = document.getElementById("meritveVitalnihZnakovEHRid");
	    if(aliDrugi == 1){
            elem.value = ehrIdDrugi;	
	    }
	    else{
	        elem.value = "92b539c8-0691-42d7-aa0a-ea252a850b0e";
	    }
	}
	if (bolnik == "3"){
	    elem = document.getElementById("meritveVitalnihZnakovEHRid");
        if(aliTretji == 1){
            elem.value = ehrIdTretji;	
	    }
	    else{
	        elem.value = "18d31071-e047-491a-b2a6-4e377aa8162b";
	    }	
	}
}

function pokaziMeritev(i){
    $("#zgornji"+i).toggle();
    $("#spodnji"+i).toggle();
}

function preberiMeritveVitalnihZnakov(){
    var sessionId = getSessionId();
    ehrId = $("#meritveVitalnihZnakovEHRid").val();
    $.ajaxSetup({
    headers: {
        "Ehr-Session": sessionId
    }
    });
    $.ajax({
        url: baseUrl + "/view/" + ehrId + "/blood_pressure",
        type: 'GET',
        success: function (res) {
            
            var results = "<table class='table table-hover'><tr><th>Datum in ura</th><th class='text-right'>Krvni tlak</th></tr>";
            var stPodatkov = res.length-1;
            var podatki = new Array(res.length);

            for (var i in res) {
                podatki[i] = {"category": (res[stPodatkov-i].time).substring(11,16),
							"column-1": res[stPodatkov-i].systolic,
							"column-2": res[stPodatkov-i].diastolic
                            };
                
                
                results += "<tr>\
                                <td class='text-left' rowspan='2' ><button onclick='pokaziMeritev("+i+")'>"+(res[i].time).substring(0,10)+"; "+(res[i].time).substring(11,16)+"</button></td>\
                                <td class='text-right' id='zgornji"+i+"' style='display:none'>"+"zgornji (sistolični): "+res[i].systolic+" "+res[i].unit+"</td>\
                            </tr>\
                            <tr>\
                                <td class='text-right' id='spodnji"+i+"' style='display:none'>"+"spodnji (diastolični): "+res[i].diastolic+" "+res[i].unit+"</td>\
                            </tr>";
            }
            results += "</table>";
			$("#result").html(results);
			
            //-----kreiranje grafa
            AmCharts.makeChart("chartdiv",
				{
					"type": "serial",
					"categoryField": "category",
					"colors": [
                		"#D80000",
                		"#FCD202",
                		"#B0DE09",
                		"#0D8ECF",
                		"#2A0CD0",
                		"#CD0D74",
                		"#CC0000",
                		"#00CC00",
                		"#0000CC",
                		"#DDDDDD",
                		"#999999",
                		"#333333",
                		"#990000"
            	    ],
					"startDuration": 1,
					"categoryAxis": {
						"gridPosition": "start"
					},
					"trendLines": [],
					"graphs": [
						{
							"balloonText": "[[title]] ob [[category]], vrednost [[value]]",
							"bullet": "round",
							"lineThickness": "6",
							"id": "AmGraph-1",
							"title": "sistolični tlak",
							"valueField": "column-1",
							"fillAlphas": 0.7,
							"lineAlpha": 0
						},
						{
							"balloonText": "[[title]] ob [[category]], vrednost [[value]]",
							"bullet": "square",
							"lineThickness": "6",
							"id": "AmGraph-2",
							"title": "diastolični tlak",
							"valueField": "column-2",
							"fillAlphas": 0.7,
							"lineAlpha": 0
						}
					],
					"guides": [],
					"valueAxes": [
						{
							"id": "ValueAxis-1",
							"title": "mm[Hg]"
						}
					],
					"allLabels": [],
					"balloon": {},
					"legend": {
						"enabled": true,
						"useGraphSettings": true
					},
					"titles": [
						{
							"id": "Title-1",
							"size": 15,
							"text": "Krvni Tlak"
						}
					],
					"dataProvider": podatki
				}
			);
		//-----konec grafa
			
        }
    });
}


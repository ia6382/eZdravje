
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
                console.log("*");
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
            elem.value = "0246d2f5-5658-4abd-8cdc-0cfaf1118fda";
        }
	}
	if (bolnik == "2"){
	    elem = document.getElementById("meritveVitalnihZnakovEHRid");
	    if(aliDrugi == 1){
            elem.value = ehrIdDrugi;	
	    }
	    else{
	        elem.value = "49faacea-d813-448d-85b6-2170e95e9911a";
	    }
	}
	if (bolnik == "3"){
	    elem = document.getElementById("meritveVitalnihZnakovEHRid");
        if(aliTretji == 1){
            elem.value = ehrIdTretji;	
	    }
	    else{
	        elem.value = "27220462-d399-4120-a93e-de9b2ec18e9c";
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
            for (var i in res) {
                results += "<tr>\
                                <td class='text-left' rowspan='2' ><button onclick='pokaziMeritev("+i+")'>"+res[i].time+"</button></td>\
                                <td class='text-right' id='zgornji"+i+"' style='display:none'>"+"zgornji (sistolični): "+res[i].systolic+" "+res[i].unit+"</td>\
                            </tr>\
                            <tr>\
                                <td class='text-right' id='spodnji"+i+"' style='display:none'>"+"spodnji (diastolični): "+res[i].diastolic+" "+res[i].unit+"</td>\
                            </tr>";
            }
            results += "</table>";
			$("#result").html(results);
			$("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>Prikazovanje Meritev za: " + ehrId + "'.</span>");
        }
    });
}


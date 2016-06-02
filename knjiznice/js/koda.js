
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

/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
 
 var compositionData1 = {
    "ctx/time": "2014-3-19T13:10Z",
    "ctx/language": "en",
    "ctx/territory": "SI",
    "vital_signs/blood_pressure/any_event/systolic": 130,
    "vital_signs/blood_pressure/any_event/diastolic": 90
};
 
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
                firstNames: "Maj",
                lastNames: "Antesic",
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
                    }
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
                data: JSON.stringify(compositionData1),
                success: function (res) {
            }
        });
        
        }
    });
    
  return ehrId;
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
            var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Krvni tlak</th></tr>";
            for (var i in res) {
                results += "<tr><td class='text-left'>" + res[i].time + "</td><td class='text-right'>" +res[i].systolic + '/' + res[i].diastolic + res[i].unit + "</td>";
            }
            results += "</table>";
			$("#result").html(results);
			$("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>Prikazovanje Meritev za: " + ehrId + "'.</span>");
        }
    });
}


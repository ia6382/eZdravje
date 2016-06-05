
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
var meritve2 = [[80,81,82,83,80,79,80,78],[55,62,64,55,67,70,66,64],[100,95,97,94,102,100,99,97]];

var diagnoza = 2; // 1 je nizek,2 je dober, 3 je visok

/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
 
var ehrId;

function pokaziGeneriranje(){
    $("#panelG").toggle();
}

function pokaziRocniVnos(){
    $("#panelR").toggle();
}

function naredibolnikaRocno(){
    var sessionId = getSessionId();
    var ehrIdRocni
    
    if (!$("#ime").val() || !$("#priimek").val() || !$("#datumRojstva").val()) {
		$("#narediSporocilo").html("<span class='obvestilo "+"label label-default'>Izpolnite zahtevana polja.</span>").fadeOut(10000);
	} else {
        $.ajaxSetup({
            headers: {
            "Ehr-Session": sessionId
            }
        });
        
        $.ajax({
            url: baseUrl + "/ehr",
            type: 'POST',
            success: function (data) {
                ehrIdRocni = data.ehrId;
                
                // build party data
                var partyData = {
                    firstNames: $("#ime").val(),
                    lastNames: $("#priimek").val(),
                    dateOfBirth: $("#datumRojstva").val(),
                    partyAdditionalInfo: [
                        {
                            key: "ehrId",
                            value: ehrIdRocni
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
                            $("#narediSporocilo").html("<span class='obvestilo "+"label label-default'>Uspešno kreiran EHR " + ehrIdRocni + ".</span>");
        		            console.log("Uspešno kreiran EHR '" + ehrIdRocni + "'.");
                        }
                    }
                });
            }
        });
	}
}

function dodajMeritveRocno() {
	var sessionId = getSessionId();
	
    var ehrIdRocni = $("#EHR").val();

	if (!ehrIdRocni || ehrIdRocni.trim().length == 0) {
		$("#dodajMeritveSporocilo").html("<span class='obvestilo "+"label label-default'>Izpolnite zahtevana polja.</span>").fadeOut(10000);
	} else {
	    
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		
		var podatki = {
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": $("#DatumInUra").val(),
		    "vital_signs/blood_pressure/any_event/systolic": $("#TlakSistolicni").val(),
		    "vital_signs/blood_pressure/any_event/diastolic": $("#TlakDiastolicni").val()
		};
		
		var queryParams = {
        "ehrId": ehrIdRocni,
        templateId: 'Vital Signs',
        format: 'FLAT',
        committer: 'Belinda Nurse'
        };
        
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(queryParams),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		        $("#dodajMeritveSporocilo").html("<span class='obvestilo "+"label label-default'>Uspešno dodane meritve.</span>").fadeOut(10000);
		    },
		    error: function(err) {
		    	$("#dodajMeritveSporocilo").html("<span class='obvestilo "+"label label-default'>Prišlo je do napake: " + JSON.parse(err.responseText).userMessage + ".").fadeOut(10000);
		    }
		});
	}
}

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
	        elem.value = "59a53d28-0631-4556-97c4-653566f98fd1";
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
    $("#panel1").show();
    $("#panel2").show();
    $("#panel3").show();
    $("#panel4").hide();
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
                podatki[i] = {"category": (res[stPodatkov-i].time).substring(5,10)+" ob "+(res[stPodatkov-i].time).substring(11,16),
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
                            
                if(res[stPodatkov-i].systolic < 90 || res[stPodatkov-i].diastolic < 60){
                    diagnoza = 1;
                }
                if(res[stPodatkov-i].diastolic > 140 || res[stPodatkov-i].diastolic > 90){
                    diagnoza = 3;
                }
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
							"balloonText": "[[title]] dne [[category]], vrednost [[value]]",
							"bullet": "round",
							"bulletSize": 12,
							"lineThickness": 7,
							"id": "AmGraph-1",
							"title": "sistolični tlak",
							"valueField": "column-1"
						},
						{
							"balloonText": "[[title]] ob [[category]], vrednost [[value]]",
							"bullet": "square",
							"bulletSize": 12,
							"lineThickness": 7,
							"id": "AmGraph-2",
							"title": "diastolični tlak",
							"valueField": "column-2"
						}
					],
					"guides": [{
                        "value": 90,
                        "toValue": 140,
                        "lineColor": "#CC0000",
                        "lineAlpha": 1,
                        "fillAlpha": 0.2,
                        "fillColor": "#CC0000",
                        "dashLength": 2,
                        "inside": true,
                        "label": "normalen sistolični tlak",
                        "valueAxis": "ValueAxis-1"
                    },
                    {
                        "value": 60,
                        "toValue": 90,
                        "lineColor": "#FFFF00",
                        "lineAlpha": 1,
                        "fillAlpha": 0.2,
                        "fillColor": "#FFFF00",
                        "dashLength": 2,
                        "inside": true,
                        "label": "normalen diastolični tlak",
                        "valueAxis": "ValueAxis-1"
                    }],
					"valueAxes": [
						{
							"id": "ValueAxis-1",
							"title": "mm Hg",
							"maximum": 180,
							"minimum": 50
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
		//-----konec grafa,zacetek obrazlage rezultatov
		    if(diagnoza == 1){ //nizek
		        $("#gumbiMap").show();
		        $("#razlaga").html("<p> Aplikacija je zaznala, da imate <strong>nenavadno nizek krvni tlak</strong>.\
		        S tem ni nič narobe, če pa občutite kakšne neželene simptome razmisljite o obisku zdravnika\
		        ali nakupu potrebnih zdravil v lekarni, če vam je zdravnik že napisal recept. \
		        Ob pritisku na izbrano zdravsteno ustanovo vam bo aplikacija poskušala poiskati \
		        lekarne ali bolnice v vaši bližini.</p><p class='text-muted'>Za delovanje te funkcionalnosti\
		        morate dovoliti brskalniku da dovoli lociranje vaše lokacije in nekaj časa za nalaganje zemljevida.</p>");
		    }
		    else if(diagnoza == 2){ //normalen
		        $("#razlaga").html("<p> Aplikacija je zaznala, da imate krvni tlak <strong>v mejah normale</strong>. \
		        Kljub temu poskušajte znižati ali vsaj ohraniti trenutno stanje za boljšo kakovost življenja. </p>");
		    }
		    else{ //visok
		        $("#gumbiMap").show();
		        $("#razlaga").html("<p> Aplikacija je zaznala, da imate krvni tlak <strong>višji od normalne meje</strong>.\
		        Svetujem vam, da razmisljite o obisku zdravnika\
		        ali nakupu potrebnih zdravil v lekarni, če vam je zdravnik že napisal recept. \
		        Visok krvni tlak lahko resno škoduje vašemu zdravju. \
		        Ob pritisku na izbrano zdravsteno ustanovo vam bo aplikacija poskušala poiskati \
		        lekarne ali bolnice v vaši bližini.</p><p class='text-muted'>Za delovanje te funkcionalnosti\
		        morate dovoliti brskalniku da dovoli lociranje vaše lokacije in nekaj časa za nalaganje zemljevida.</p>");
		    }
			
        }
    });
    
    }
    
    function pokaziZemljevid(ustanova){
        $("#panel4").show();
        var map;
        var infoWindow;

        //function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: -34.397, lng: 150.644},
          zoom: 15
        });

        // Try HTML5 geolocation.
        if (navigator.geolocation) {
            
          navigator.geolocation.getCurrentPosition(function(position) {
              
            var pos = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
            infoWindow = new google.maps.InfoWindow({map: map});
            infoWindow.setPosition(pos);
            infoWindow.setContent('Vaša približna lokacija.');
            map.setCenter(pos);
            
            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
                location: pos,
                radius: 500000,
                //name: ['ZD', 'zdravstveni dom', 'bolnica', 'UKC', 'bolnišnica', 'hospital', 'ambulanta'],
                type: [ustanova]
            }, callback);
            
          }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
          });
          
        } else {
          // Browser doesn't support Geolocation
          handleLocationError(false, infoWindow, map.getCenter());
        }
      //}

      function callback(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
          }
        }
      }

      function createMarker(place) {
        var placeLoc = place.geometry.location;
        var marker = new google.maps.Marker({
          map: map,
          position: place.geometry.location
        });

        google.maps.event.addListener(marker, 'click', function() {
          infoWindow.setContent(place.name);
          infoWindow.open(map, this);
        });
      }
      
      
      function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
                              'Error: The Geolocation service failed.' :
                              'Error: Your browser doesn\'t support geolocation.');
      }
    }


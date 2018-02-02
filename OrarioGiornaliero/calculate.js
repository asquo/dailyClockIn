function findControls() {
	this.continuato = document.getElementById('continuato');
	this.entrata = document.getElementById('entrata');
	this.uscitapranzo = document.getElementById('uscita_pranzo');
	this.entratapranzo = document.getElementById('entrata_pranzo');
	this.uscita = document.getElementById('uscita');
	this.uscitaprevista = document.getElementById('uscita_prevista');
	this.straordinarie = document.getElementById('straordinarie');
}

function loadValueFromCookie(){
	var controls = new findControls();	
	//controls.continuato.checked = getCookie('tsEntrata', controls.entrata.value);
	controls.entrata.value = getCookie('tsEntrata', controls.entrata.value);
	controls.uscitapranzo.value = getCookie('tsUscitaPranzo', controls.uscitapranzo.value);
	controls.entratapranzo.value = getCookie('tsEntrataPranzo', controls.entratapranzo.value);
	controls.uscita.value = getCookie('tsUscita', controls.uscita.value);
}

function onContinuatoChangedHandler(){
	calcolaUscitaPrevista();
}

function arrivalTemplate(hour){
	var controls = new findControls();
	controls.uscitapranzo.value = "13:00"; 
	controls.entratapranzo.value = "14:00"
	
	switch(hour){
		case 8:
			controls.entrata.value = "08:00";
			controls.uscita.value = "17:00"
			break;
			
		default:
			controls.entrata.value = "09:00";
			controls.uscita.value = "18:00"
			break;
	}	
	
	calcolaUscitaPrevista();
}

function calcolaUscitaPrevista() {	
	var controls = new findControls();
	var red = '#ff0000';
	var white = '#ffffff';
	
	var tsUscitaPrevista = "Non calcolata";
	controls.uscitaprevista.value = tsUscitaPrevista;
	
	var tsEntrata = validateTime(controls.entrata.value);
	var tsUscitaPranzo = validateTime(controls.uscitapranzo.value);
	var tsEntrataPranzo = validateTime(controls.entratapranzo.value);
	var tsUscita = validateTime(controls.uscita.value);
	
	controls.entrata.style.backgroundColor = (tsEntrata === false) ? red : white;
	controls.uscitapranzo.style.backgroundColor = (tsUscitaPranzo === false) ? red : white;
	controls.entratapranzo.style.backgroundColor = (tsEntrataPranzo === false) ? red : white;
	controls.uscita.style.backgroundColor = (tsUscita === false) ? red : white;
	
	var canCalculate = (tsEntrata !== false && tsUscitaPranzo !== false && tsEntrataPranzo !== false);
	
	if(canCalculate) {
		tsEntrata = new timespan(tsEntrata);
		tsEntrata = moment().hour(tsEntrata.hour).minute(tsEntrata.minute);

		tsUscitaPranzo = new timespan(tsUscitaPranzo);
		tsUscitaPranzo = moment().hour(tsUscitaPranzo.hour).minute(tsUscitaPranzo.minute);
		
		tsEntrataPranzo = new timespan(tsEntrataPranzo);
		tsEntrataPranzo = moment().hour(tsEntrataPranzo.hour).minute(tsEntrataPranzo.minute);
		
		if(tsUscita !== false) {
			tsUscita = new timespan(tsUscita);
			tsUscita = moment().hour(tsUscita.hour).minute(tsUscita.minute);
		}
		
		tsUscitaPrevista = moment(tsEntrata).add(controls.continuato.checked ? 8 : 9, 'hours');
		tsStraordinarie = moment().hour(0).minute(0);		
		tsRitardoPausaPranzo = moment(tsEntrataPranzo).subtract(tsUscitaPranzo.hour(), 'hours').subtract(tsUscitaPranzo.minute(), 'minutes');
		
		//se il ritardo � di 0 ore, allora non ho fatto ritardo da pausa pranzo
		//se il ritardo � di 1 ore, allora potrei aver fatto dei minuti di ritardo
		//se il ritardo � > di 1 ore, allora ho fatto sicuramente ritardo
		switch(tsRitardoPausaPranzo.hour()){
			case 0:
				tsRitardoPausaPranzo = moment().hour(0).minute(0);
				break;				
			
			case 1:
				tsRitardoPausaPranzo = tsRitardoPausaPranzo.hour(0).minute(tsRitardoPausaPranzo.minutes());
				break;				
			
			default:
				tsRitardoPausaPranzo = tsRitardoPausaPranzo.hour(tsRitardoPausaPranzo.hour()-1).minute(tsRitardoPausaPranzo.minutes());
				break;
		}
		
		//calcolo l'orario delle 7 e delle 8
		if(tsEntrata.hour() > 6 && tsEntrata.hour() < 9) {
			if(tsEntrata.minutes() <= 5) {
				tsUscitaPrevista.minute(tsEntrata.minutes());
			} else {
				if(tsEntrata.minutes() > 5 && tsEntrata.minutes() <= 30) {
					tsUscitaPrevista.minute(30);
					tsStraordinarie.minute(30 - tsEntrata.minutes());
				} else {
					if(tsEntrata.minutes() > 30 && tsEntrata.minutes() <= 35) {
						tsUscitaPrevista.minute(tsEntrata.minutes());
						tsStraordinarie.minute(tsEntrata.minutes() - tsEntrata.minutes());
					} else { 
						tsUscitaPrevista = moment(tsUscitaPrevista).add(1, 'hours');
						tsUscitaPrevista.minute(0);
						tsStraordinarie.minute(60 - tsEntrata.minute());
					}
				}
			}
		}
		
		//calcolo l'orario successivo o compreso alle 9
		if(tsEntrata.hour() >= 9) {
			if(tsEntrata.minutes() <= 15) {
				tsUscitaPrevista.minute(tsEntrata.minutes());
			} else {
				if(tsEntrata.minutes() > 15 && tsEntrata.minutes() <= 30) {
					tsUscitaPrevista.minute(30);
				} else {
					if(tsEntrata.minutes() > 30 && tsEntrata.minutes() <= 45) {
						tsUscitaPrevista.minute(45);
					} else {
						tsUscitaPrevista = moment(tsUscitaPrevista).add(1, 'hours');
						tsUscitaPrevista.minute(0);
					}
				}
			}
		}
		
		//calcolo l'uscita prevista dopo aver calcolato tutte le altre timbrature
		//devo calcolare l'uscita prevista anche in base al ritardo dalla pausa pranzo in modo corretto (15 minuti da recuperare, dopo si scala al quarto d'ora)
		if(tsRitardoPausaPranzo.hour() === 0 && tsRitardoPausaPranzo.minutes() <= 15) {
			tsUscitaPrevista = moment(tsUscitaPrevista).add(tsRitardoPausaPranzo.hour(), 'hours').add(tsRitardoPausaPranzo.minutes(), 'minutes');
		} else {
			//se ho fatto pi� di 15 minuti di ritardo scalo sul quarto d'ora
			//tsUscitaPrevista = moment(tsUscitaPrevista).add(tsRitardoPausaPranzo.hour(), 'hours');
			
			if(tsRitardoPausaPranzo.minutes() === 0) {
				tsUscitaPrevista = moment(tsUscitaPrevista).add(tsRitardoPausaPranzo.hour(), 'hours');
			} else {
				if(tsRitardoPausaPranzo.minutes() <= 15) {
					tsUscitaPrevista = moment(tsUscitaPrevista).minute(tsRitardoPausaPranzo.minutes());
				} else {			
					if(tsRitardoPausaPranzo.minutes() > 15 && tsRitardoPausaPranzo.minutes() <= 30) {				
						tsUscitaPrevista = moment(tsUscitaPrevista).minute(30);
					} else {
						if(tsRitardoPausaPranzo.minutes() > 30 && tsRitardoPausaPranzo.minutes() <= 45) {					
							tsUscitaPrevista = moment(tsUscitaPrevista).minute(45);
						} else {					
							tsUscitaPrevista = moment(tsUscitaPrevista).add(1, 'hours');
							tsUscitaPrevista = moment(tsUscitaPrevista).minute(0);
						}
					}
				}			
			}
		}
		
		//calcolo le straordinarie anche in base all'ora di uscita impostata, solo se la data di uscita impostata � la stessa o successiva all'uscita prevista (altrimenti significa che sono uscito prima)		
		if(tsUscita !== false) {
			var isSameOrAfter = tsUscita.isSameOrAfter(tsUscitaPrevista);
			if(isSameOrAfter) {
				var straordinarieSerali = moment(tsUscita).subtract(tsUscitaPrevista.hour(), 'hours').subtract(tsUscitaPrevista.minutes(), 'minutes');
				tsStraordinarie.add(straordinarieSerali.hour(), 'hours').add(straordinarieSerali.minutes(), 'minutes');
			}
		}
		
		controls.uscitaprevista.innerHTML = tsUscitaPrevista.format('HH:mm');
		controls.straordinarie.innerHTML = tsStraordinarie.format('HH:mm');
	} else {
		controls.uscitaprevista.innerHTML = "Non calcolata";
		controls.straordinarie.innerHTML = "Non calcolata";
	}
	
	controls.uscitaprevista.innerHTML = tsUscitaPrevista.format('HH:mm');
	controls.straordinarie.innerHTML = tsStraordinarie.format('HH:mm');
	
	//salvo tutto nei cookie
	setCookie('tsEntrata', tsEntrata.format('HH:mm'), 1);
	setCookie('tsUscitaPranzo', tsUscitaPranzo.format('HH:mm'), 1);
	setCookie('tsEntrataPranzo', tsEntrataPranzo.format('HH:mm'), 1);
	setCookie('tsUscita', tsUscita.format('HH:mm'), 1);
}
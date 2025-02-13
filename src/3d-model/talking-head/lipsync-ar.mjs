/**
 * @class Arabic lip-sync processor
 * @author
 */

class LipsyncAr {
  /**
   * @constructor
   */
  constructor() {
    // Arabic letters to Oculus visemes, rules adapted for Arabic phonetics
    this.rules = {
      ا: ['[ا]=aa'],
      ب: ['[ب]=PP'],
      ت: ['[ت]=DD'],
      ث: ['[ث]=TH'],
      ج: ['[ج]=CH'],
      ح: ['[ح]=HH'],
      خ: ['[خ]=KH'],
      د: ['[د]=DD'],
      ذ: ['[ذ]=TH'],
      ر: ['[ر]=RR'],
      ز: ['[ز]=ZZ'],
      س: ['[س]=SS'],
      ش: ['[ش]=SH'],
      ص: ['[ص]=SS'],
      ض: ['[ض]=DD'],
      ط: ['[ط]=TT'],
      ظ: ['[ظ]=TH'],
      ع: ['[ع]=AA'],
      غ: ['[غ]=GH'],
      ف: ['[ف]=FF'],
      ق: ['[ق]=KK'],
      ك: ['[ك]=KK'],
      ل: ['[ل]=LL'],
      م: ['[م]=MM'],
      ن: ['[ن]=NN'],
      ه: ['[ه]=HH'],
      و: ['[و]=OO'],
      ي: ['[ي]=EE'],
    };

    const ops = {
      '#': '[اأإءؤئ]+', // One or more Arabic vowels
      '.': '[بجدهو]', // One voiced consonant
      '%': '(?:من|مع|في|على|عن|إلى|حتى)', // Common Arabic prepositions
      '&': '(?:[شسصزج]|تش|شج)', // Common Arabic sibilants
      '@': '(?:[تسجشضط]|تش|شج)', // Common Arabic plosives
      '^': '[بتثجحخدذرزسشصضطظعغفقكلمنهوي]', // One consonant
      '+': '[ي]', // One of ي
      ':': '[بتثجحخدذرزسشصضطظعغفقكلمنهوي]*', // Zero or more consonants
      ' ': '\\b', // Start/end of the word
    };

    // Convert rules to regex
    Object.keys(this.rules).forEach((key) => {
      this.rules[key] = this.rules[key].map((rule) => {
        const posL = rule.indexOf('[');
        const posR = rule.indexOf(']');
        const posE = rule.indexOf('=');
        const strLeft = rule.substring(0, posL);
        const strLetters = rule.substring(posL + 1, posR);
        const strRight = rule.substring(posR + 1, posE);
        const strVisemes = rule.substring(posE + 1);

        const o = { regex: '', move: 0, visemes: [] };

        let exp = '';
        exp += [...strLeft].map((x) => ops[x] || x).join('');
        const ctxLetters = [...strLetters];
        ctxLetters[0] = ctxLetters[0].toLowerCase();
        exp += ctxLetters.join('');
        o.move = ctxLetters.length;
        exp += [...strRight].map((x) => ops[x] || x).join('');
        o.regex = new RegExp(exp);

        if (strVisemes.length) {
          strVisemes.split(' ').forEach((viseme) => {
            o.visemes.push(viseme);
          });
        }

        return o;
      });
    });

    // Viseme durations in relative unit (1=average)
    this.visemeDurations = {
      aa: 0.95,
      E: 0.9,
      I: 0.92,
      O: 0.96,
      U: 0.95,
      PP: 1.08,
      SS: 1.23,
      TH: 1,
      DD: 1.05,
      FF: 1.0,
      KK: 1.21,
      NN: 0.88,
      RR: 0.88,
      DD: 1.05,
      sil: 1,
    };

    // Pauses in relative units (1=average)
    this.specialDurations = { ' ': 1, ',': 3, '-': 0.5, "'": 0.5 };

    // Arabic number words
    this.digits = ['صفر', 'واحد', 'اثنين', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    this.ones = ['', 'واحد', 'اثنين', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    this.tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    this.teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];

    // Symbols to Arabic
    this.symbols = {
      '%': 'بالمئة',
      '€': 'يورو',
      '&': 'و',
      '+': 'زائد',
      $: 'دولار',
    };
    this.symbolsReg = /[%€&\+\$]/g;
  }

  convert_digit_by_digit(num) {
    num = String(num).split('');
    let numWords = '';
    for (let m = 0; m < num.length; m++) {
      numWords += this.digits[num[m]] + ' ';
    }
    numWords = numWords.substring(0, numWords.length - 1); //kill final space
    return numWords;
  }

  convert_sets_of_two(num) {
    let firstNumHalf = String(num).substring(0, 2);
    let secondNumHalf = String(num).substring(2, 4);
    let numWords = this.convert_tens(firstNumHalf);
    numWords += ' ' + this.convert_tens(secondNumHalf);
    return numWords;
  }

  convert_millions(num) {
    if (num >= 1000000) {
      return this.convert_millions(Math.floor(num / 1000000)) + ' مليون ' + this.convert_thousands(num % 1000000);
    } else {
      return this.convert_thousands(num);
    }
  }

  convert_thousands(num) {
    if (num >= 1000) {
      return this.convert_hundreds(Math.floor(num / 1000)) + ' ألف ' + this.convert_hundreds(num % 1000);
    } else {
      return this.convert_hundreds(num);
    }
  }

  convert_hundreds(num) {
    if (num > 99) {
      return this.ones[Math.floor(num / 100)] + ' مئة ' + this.convert_tens(num % 100);
    } else {
      return this.convert_tens(num);
    }
  }

  convert_tens(num) {
    if (num < 10) return this.ones[num];
    else if (num >= 10 && num < 20) {
      return this.teens[num - 10];
    } else {
      return this.tens[Math.floor(num / 10)] + ' ' + this.ones[num % 10];
    }
  }

  convertNumberToWords(num) {
    if (num == 0) {
      return 'صفر';
    } else if ((num < 1000 && num > 99) || (num > 10000 && num < 1000000)) {
      //read area and zip codes digit by digit
      return this.convert_digit_by_digit(num);
    } else if ((num > 1000 && num < 2000) || (num > 2009 && num < 3000)) {
      //read years as two sets of two digits
      return this.convert_sets_of_two(num);
    } else {
      return this.convert_millions(num);
    }
  }

  /**
   * Preprocess text:
   * - convert symbols to words
   * - convert numbers to words
   * - filter out characters that should be left unspoken
   * @param {string} s Text
   * @return {string} Pre-processsed text.
   */
  preProcessText(s) {
    return s
      .replace('/[#_*":;]/g', '')
      .replace(this.symbolsReg, (symbol) => {
        return ' ' + this.symbols[symbol] + ' ';
      })
      .replace(/(\d)\,(\d)/g, '$1 فاصل $2') // Number separator
      .replace(/\d+/g, this.convertNumberToWords.bind(this)) // Numbers to words
      .replace(/(\D)\1\1+/g, '$1$1') // max 2 repeating chars
      .replaceAll('  ', ' ') // Only one repeating space
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .normalize('NFC') // Remove non-Arabic diacritics
      .trim();
  }

  /**
   * Convert word to Oculus LipSync Visemes and durations
   * @param {string} w Text
   * @return {Object} Oculus LipSync Visemes and durations.
   */
  wordsToVisemes(w) {
    let o = { words: w, visemes: [], times: [], durations: [], i: 0 };
    let t = 0;

    const chars = [...o.words];
    while (o.i < chars.length) {
      const c = chars[o.i];
      const ruleset = this.rules[c];
      if (ruleset) {
        for (let i = 0; i < ruleset.length; i++) {
          const rule = ruleset[i];
          const test = o.words.substring(0, o.i) + c + o.words.substring(o.i + 1);
          let matches = test.match(rule.regex);
          if (matches) {
            rule.visemes.forEach((viseme) => {
              if (o.visemes.length && o.visemes[o.visemes.length - 1] === viseme) {
                const d = 0.7 * (this.visemeDurations[viseme] || 1);
                o.durations[o.durations.length - 1] += d;
                t += d;
              } else {
                const d = this.visemeDurations[viseme] || 1;
                o.visemes.push(viseme);
                o.times.push(t);
                o.durations.push(d);
                t += d;
              }
            });
            o.i += rule.move;
            break;
          }
        }
      } else {
        o.i++;
        t += this.specialDurations[c] || 0;
      }
    }

    return o;
  }
}

export { LipsyncAr };

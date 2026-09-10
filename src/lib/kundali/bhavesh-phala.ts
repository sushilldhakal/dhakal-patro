/** भावेश फल — classical lord-placement results, per Brihat Parashara Hora
 * Shastra (बृहत्पाराशर होराशास्त्र) ch. 27. Keyed [houseWhoseLordThisIs][houseTheLordSitsIn].
 * Coverage matches the source text: not every lord × house combination is
 * covered there, so lookups can come back undefined — callers fall back to
 * showing only the computed placement fact in that case. */

export interface BhaveshPhala {
  ne: string;
  en: string;
}

export const BHAVESH_PHALA: Record<number, Record<number, BhaveshPhala>> = {
  1: {
    1: { ne: "शारीरिक सुख, पराक्रमी, मनस्वी र चंचल स्वभाव", en: "Bodily comfort, valorous, spirited and restless nature" },
    2: { ne: "लाभवान्, विद्वान्, सुखी र धार्मिक", en: "Gains wealth, learned, content and righteous" },
    4: { ne: "आमाबाबुको सुख, धेरै दाजुभाइ र सुन्दर शरीर", en: "Happiness from parents, many siblings and a fine physique" },
    5: { ne: "मध्यम सन्तान सुख, क्रोधी तर राजाको प्रिय", en: "Moderate happiness from children, quick-tempered but favoured by rulers" },
    7: { ne: "पापग्रह भए पत्नीबियोग; शुभग्रह भए राजा वा विरक्त स्वभाव", en: "If malefic, separation from spouse; if benefic, ruler-like or renunciate" },
    8: { ne: "सिद्धविद्यामा निपुण, रोगी, चोर र अति क्रोधी", en: "Skilled in occult sciences, sickly, thieving and very quick-tempered" },
    9: { ne: "भाग्यशाली, लोकप्रिय, विष्णुभक्त र वाकपटु", en: "Fortunate, popular, devoted to Vishnu and eloquent" },
    10: { ne: "राजसुख, विद्वान् र प्रसिद्ध", en: "Favour of rulers, learned and renowned" },
    12: { ne: "धनहीन, व्यर्थ घुम्ने र क्रोधी स्वभाव", en: "Lacks wealth, wanders aimlessly and is quick-tempered" },
  },
  2: {
    1: { ne: "धनवान्, पुत्रवान् तर कुटुम्बसँग विरोध राख्ने", en: "Wealthy, blessed with sons, but at odds with family" },
    2: { ne: "अत्यधिक धनवान् र अहंकारी", en: "Very wealthy and arrogant" },
    3: { ne: "पराक्रमी, गुणवान् तर पाप-प्रभावमा नास्तिक", en: "Valorous and virtuous, but irreligious if afflicted" },
    4: { ne: "सबै सुखले युक्त; धनेश केन्द्रमा उच्चको भए राजासरह", en: "Endowed with every comfort; ruler-like if exalted in a kendra" },
    6: { ne: "शुभ प्रभावमा शत्रुबाट धनप्राप्ति, अन्यथा धनहानि र जाँघमा दोष", en: "Wealth from rivals if well-disposed, otherwise financial loss and a thigh ailment" },
    7: { ne: "चिकित्सक (वैद्य) र परस्त्रीमा रुचि राख्ने", en: "Works as a physician and is drawn to other people's spouses" },
    8: { ne: "धनको अभाव, गाडिएको धन भेट्टाउने सम्भावना", en: "Short of wealth, though may recover buried treasure" },
    9: { ne: "भाग्यशाली र धनी", en: "Fortunate and wealthy" },
    10: { ne: "विद्वान्, सम्मानित र बहुपत्नी हुने", en: "Learned, respected, and takes more than one spouse" },
    12: { ne: "धनहीन, अरूको भाग्यमा आश्रित", en: "Without wealth, dependent on others' fortune" },
  },
  3: {
    1: { ne: "स्व-आर्जित धन, दुब्लो शरीर र साहसी", en: "Self-earned wealth, a lean build and courageous" },
    3: { ne: "दाजुभाइको सुख र धनवान्", en: "Happiness from siblings and wealthy" },
    4: { ne: "सुखी, धनवान् तर क्रूर पत्नी हुने", en: "Content and wealthy, but married to a harsh spouse" },
    7: { ne: "राजसेवामा रुचि र बाल्यकालमा कष्ट", en: "Drawn to government service, hardship in childhood" },
    8: { ne: "चोर, अरूको सेवा गर्ने र राजद्वारमा मृत्युको सम्भावना", en: "Thieving, works in service, may die near a seat of power" },
    9: { ne: "स्त्रीहरूमार्फत भाग्योदय, बाबुसँग मनमुटाव र सन्तान सुख", en: "Rises in fortune through women, at odds with the father, happiness from children" },
    10: { ne: "सबै सुखले युक्त र दुष्ट स्त्रीहरूको भरण-पोषण गर्ने", en: "Endowed with every comfort, supports women of poor character" },
    12: { ne: "खराब कार्यमा धन खर्च र क्रूर बाबु", en: "Spends on ill deeds, has a harsh father" },
  },
  4: {
    1: { ne: "विद्या, सवारी र भूमिको सुख", en: "Happiness from learning, vehicles and land" },
    4: { ne: "मन्त्री, चतुर र सबै प्रकारको धनले युक्त", en: "A minister, clever, endowed with every kind of wealth" },
    5: { ne: "विष्णुभक्त र स्व-आर्जित धन", en: "Devoted to Vishnu, with self-earned wealth" },
    6: { ne: "आमाको सुख कम, क्रोधी र अल्छी", en: "Little happiness from the mother, quick-tempered and lazy" },
    7: { ne: "शिक्षित र बाबुको भूमि प्राप्त गर्ने", en: "Educated, inherits the father's land" },
    8: { ne: "सुखको अभाव, घरबारविहीन र मित्रद्रोही", en: "Lacks comfort, without a settled home, betrays friends" },
    10: { ne: "राजाबाट सम्मानित र औषधिको जानकार", en: "Honoured by rulers, knowledgeable in medicine" },
    12: { ne: "घर र भूमिको हानि", en: "Loss of home and land" },
  },
  5: {
    1: { ne: "विद्वान्, सन्तान सुख र छलकपटी स्वभाव", en: "Learned, happiness from children, but given to deceit" },
    2: { ne: "धनवान्, मधुरभाषी र कुटुम्बको पोषण गर्ने", en: "Wealthy, sweet-spoken, provides for the family" },
    5: { ne: "शुभ भए पुत्रवान्, अन्यथा सन्तानहीन", en: "Blessed with sons if well-disposed, otherwise childless" },
    6: { ne: "सन्तानसँग शत्रुता वा धर्मपुत्र हुने", en: "At odds with one's children, or raises an adopted son" },
    8: { ne: "थोरै सन्तान सुख र खोकी-स्वासको रोगी", en: "Little happiness from children, suffers cough and breathing trouble" },
    9: { ne: "कुलदीपक, प्रसिद्ध लेखक र राजकुमारसरह", en: "Pride of the family, a renowned author, prince-like" },
    10: { ne: "राजयोग, अत्यन्त धनी र सबै विद्यामा निपुण", en: "Rise to high status, very wealthy, accomplished in every field" },
    12: { ne: "आफ्नै सन्तानको सुख कम, धर्मपुत्रको सम्भावना", en: "Little happiness from one's own children, may raise an adopted son" },
  },
  6: {
    1: { ne: "प्रसिद्ध तर आफ्नै मानिसको शत्रु, साहसी र गुणवान्", en: "Renowned yet at odds with one's own people, courageous and virtuous" },
    2: { ne: "कुटुम्बसँग विरोध र वाणीमा दोष", en: "Conflict with family and a flaw in speech" },
    4: { ne: "आमाको सुखमा कमी र चंचल मन", en: "Reduced happiness from the mother, a restless mind" },
    6: { ne: "आफ्नो कुलमा प्रसिद्ध र मामासँग शत्रुता", en: "Renowned within one's own lineage, at odds with the maternal uncle" },
    7: { ne: "वैवाहिक जीवनमा तनाव र पत्नीसँग विरोध", en: "Strain in married life, conflict with the spouse" },
    8: { ne: "रोगी, अरूको धन चाहने र पापी स्वभाव", en: "Sickly, covets others' wealth, and of a sinful nature" },
    10: { ne: "शत्रुमाथि विजय तर बाबुको सुख कम", en: "Victory over rivals, but little happiness from the father" },
    11: { ne: "शत्रुबाट धनलाभ तर सन्तानका लागि कष्टकर", en: "Gains wealth from rivals, but this brings hardship to one's children" },
    12: { ne: "दुष्ट स्वभाव, परस्त्रीमा रुचि र खर्चिलो", en: "Ill-natured, drawn to other people's spouses, and spendthrift" },
  },
  7: {
    1: { ne: "चतुर, चंचल मन र परस्त्रीगामी", en: "Clever, restless-minded, drawn to other people's spouses" },
    2: { ne: "पत्नीमार्फत धनलाभ र धेरै स्त्री", en: "Gains wealth through the spouse, and more than one partner" },
    3: { ne: "सन्तानहानि वा ठूलो कठिनाइले पुत्रप्राप्ति", en: "Loss of children, or a son gained only with great difficulty" },
    6: { ne: "रोगी पत्नी वा पत्नीसँग शत्रुता र सम्बन्धविच्छेदको सम्भावना", en: "A sickly spouse, or conflict with the spouse and possible separation" },
    7: { ne: "सुन्दर र गुणवान् पत्नी, स्वयं बुद्धिमान्", en: "A beautiful, virtuous spouse; wise personally" },
    8: { ne: "पत्नी दुष्ट स्वभावकी र रोगी", en: "An ill-natured, sickly spouse" },
    10: { ne: "पत्नी आज्ञाकारी नहुने तर स्वयं धार्मिक र धनी", en: "A less obedient spouse, but righteous and wealthy oneself" },
    12: { ne: "दरिद्र, कञ्जुस र खर्चिली पत्नी", en: "Poor and stingy, with a spendthrift spouse" },
  },
  8: {
    1: { ne: "शारीरिक सुख कम, देवता र ब्राह्मणको निन्दा गर्ने", en: "Little bodily comfort, and disrespects gods and priests" },
    2: { ne: "कम बल, थोरै धन र हराएको धन नफर्कने", en: "Low vitality, little wealth, and lost wealth that never returns" },
    3: { ne: "दाजुभाइबाट सुख छैन, अल्छी र बलहीन", en: "No happiness from siblings, lazy and weak" },
    5: { ne: "बुद्धिहीन, थोरै सन्तान र दीर्घायु", en: "Lacking wisdom, few children, but long-lived" },
    7: { ne: "व्यापारमा हानि र दुई पत्नी", en: "Loss in business, and takes two spouses" },
    8: { ne: "दीर्घायु; स्वामी कमजोर भए मध्यम आयु र चोर", en: "Long-lived; if the lord is weak, only a middling lifespan and thieving" },
    9: { ne: "नास्तिक, दुष्ट पत्नी हुने र बाबुको सुख कम", en: "Irreligious, an ill-natured spouse, little happiness from the father" },
    12: { ne: "खराब कार्यमा धन खर्च र अल्पायु", en: "Spends on ill deeds and a short lifespan" },
  },
  9: {
    1: { ne: "भाग्यशाली, राजाबाट सम्मानित, सुन्दर र विद्वान्", en: "Fortunate, honoured by rulers, good-looking and learned" },
    2: { ne: "धनी, विद्वान् र सबैको प्रिय", en: "Wealthy, learned and well-liked by all" },
    3: { ne: "दाजुभाइबाट लाभ र धनी", en: "Gains through siblings, and wealthy" },
    4: { ne: "आमा र घरको सुख, देवभक्त", en: "Happiness from the mother and home, devoted to the gods" },
    7: { ne: "पत्नीमार्फत भाग्योदय र प्रसिद्ध", en: "Rises in fortune through the spouse, and renowned" },
    9: { ne: "अत्यन्त भाग्यशाली र भाइहरूबाट सुख", en: "Exceptionally fortunate, happiness from brothers" },
    10: { ne: "मन्त्री वा सेनापति, राजासरह वैभव", en: "A minister or army chief, with ruler-like grandeur" },
    11: { ne: "दैनिक धनलाभ र गुरुभक्त", en: "Daily gains in wealth, devoted to one's teacher" },
    12: { ne: "भाग्यको हानि र पाहुनामा धेरै खर्च", en: "Loss of fortune, and heavy spending on guests" },
  },
  10: {
    1: { ne: "विद्वान्, प्रसिद्ध र कवि", en: "Learned, renowned, and a poet" },
    2: { ne: "धनवान्, गुणवान् र राजमान्य", en: "Wealthy, virtuous, and honoured by rulers" },
    4: { ne: "सुखी, मन्त्री र आमाभक्त", en: "Content, a minister, devoted to the mother" },
    5: { ne: "सबै विद्यामा निपुण, सुखी र पुत्रवान्", en: "Accomplished in every field, content, blessed with sons" },
    6: { ne: "बाबुको सुख कम, चतुर भए पनि धनहीन", en: "Little happiness from the father, and though clever, lacking wealth" },
    7: { ne: "पत्नी सुन्दर र आज्ञाकारी, स्वयं सत्यवादी", en: "A beautiful, obedient spouse; truthful personally" },
    9: { ne: "राजकुमारसरह वैभव र राजाको प्रिय", en: "Prince-like grandeur, favoured by rulers" },
    10: { ne: "सबै कार्यमा सफल र सत्य बोल्ने", en: "Successful in every undertaking, and truthful" },
    11: { ne: "धनवान्, सुखी, सत्यवादी र पुत्रवान्", en: "Wealthy, content, truthful, and blessed with sons" },
    12: { ne: "राजकोषबाट खर्च र शत्रुबाट डर", en: "Spends from the state treasury, and fears rivals" },
  },
  11: {
    1: { ne: "सात्विक, धनी, सुखी र वाकपटु", en: "Pure-natured, wealthy, content, and eloquent" },
    2: { ne: "सर्वसिद्धि प्राप्त, दानी र धार्मिक", en: "Achieves every success, charitable, and righteous" },
    3: { ne: "सबै कार्यमा कुशल र भाइहरूबाट सुख", en: "Skilled in every undertaking, happiness from brothers" },
    4: { ne: "नानीघरबाट लाभ र तीर्थयात्रा गर्ने", en: "Gains through the maternal family, undertakes pilgrimages" },
    6: { ne: "रोगी, क्रूर र विदेशमा बस्ने", en: "Sickly, harsh-natured, and settles abroad" },
    8: { ne: "कार्यमा बाधा तर दीर्घायु; पत्नीको मृत्यु पहिले हुन सक्छ", en: "Obstacles in one's affairs but long-lived; the spouse may pass first" },
    11: { ne: "सबै कार्यमा लाभ, विद्या र सुखमा वृद्धि", en: "Gains in every undertaking, growth in learning and comfort" },
    12: { ne: "राम्रा कार्यमा खर्च, कामुक र विदेशीसँग मित्रता", en: "Spends on good deeds, sensuous, and befriends foreigners" },
  },
  12: {
    1: { ne: "कमजोर शरीर, वाकपटु तर खर्चिलो", en: "A weak build, eloquent but spendthrift" },
    2: { ne: "धर्महीन, अशिष्ट बोली र दुःखी", en: "Irreligious, coarse of speech, and sorrowful" },
    3: { ne: "भाइहरूको सुख छैन र स्वार्थी", en: "No happiness from brothers, and self-serving" },
    4: { ne: "आमाको सुख कम, घर र सवारीको हानि", en: "Little happiness from the mother, loss of home and vehicles" },
    5: { ne: "सन्तान सुख कम र तीर्थाटनमा रुचि", en: "Little happiness from children, drawn to pilgrimage" },
    6: { ne: "आफ्नै मानिसहरूसँग शत्रुता, क्रोधी र परस्त्रीगामी", en: "At odds with one's own people, quick-tempered, drawn to other people's spouses" },
    8: { ne: "सधैं लाभ, प्रिय बोली र मध्यम आयु — विपरीत राजयोग", en: "Constant gains, pleasant speech, a middling lifespan — a reversed rajayoga" },
    10: { ne: "राजकीय लाभ तर बाबुको सुख कम", en: "Gains through the state, but little happiness from the father" },
    11: { ne: "लाभको आशामा हानि", en: "Loss while hoping for gain" },
    12: { ne: "अत्यधिक खर्च, क्रोधी र मानिसहरूसँग द्वेष गर्ने", en: "Excessive spending, quick-tempered, and holds grudges against people" },
  },
};

export function bhaveshPhalaFor(house: number, lordHouse: number): BhaveshPhala | undefined {
  return BHAVESH_PHALA[house]?.[lordHouse];
}

package com.e_commerce.backend.common;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

/**
 * Validates phone numbers and normalises them to E.164 (e.g. "+38161123456") using
 * Google's libphonenumber, the same rule set the frontend uses through libphonenumber-js.
 * Storing a single canonical format keeps numbers comparable and ready for SMS/carrier APIs.
 */
@Component
public class PhoneNumbers {

    private final PhoneNumberUtil util = PhoneNumberUtil.getInstance();

    /** English country name → ISO 3166 region code, used as a hint for numbers typed without "+". */
    private final Map<String, String> regionByCountryName = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);

    public PhoneNumbers() {
        for (String region : util.getSupportedRegions()) {
            regionByCountryName.put(Locale.of("", region).getDisplayCountry(Locale.ENGLISH), region);
        }
    }

    /**
     * @param raw         the number as submitted (ideally already E.164)
     * @param countryName the address country, used to interpret national numbers such as "061 123456"
     * @return the E.164 number, or {@code null} when no number was given
     * @throws ApiException if the number is not valid
     */
    public String normalize(String raw, String countryName) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String region = countryName == null ? "ZZ" : regionByCountryName.getOrDefault(countryName.trim(), "ZZ");
        try {
            PhoneNumber number = util.parse(raw.trim(), region);
            if (!util.isValidNumber(number)) {
                throw ApiException.badRequest("Enter a valid phone number for the selected country");
            }
            return util.format(number, PhoneNumberUtil.PhoneNumberFormat.E164);
        } catch (NumberParseException e) {
            throw ApiException.badRequest("Enter a valid phone number, including the country code");
        }
    }
}

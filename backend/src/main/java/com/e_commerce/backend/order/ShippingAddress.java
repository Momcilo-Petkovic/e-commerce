package com.e_commerce.backend.order;

import com.e_commerce.backend.address.Address;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Snapshot of the delivery address at the time of purchase, so editing or deleting
 * an address later never changes past orders.
 */
@Embeddable
public class ShippingAddress {

    @Column(name = "ship_full_name") private String fullName;
    @Column(name = "ship_line1") private String line1;
    @Column(name = "ship_line2") private String line2;
    @Column(name = "ship_city") private String city;
    @Column(name = "ship_state") private String state;
    @Column(name = "ship_postal_code") private String postalCode;
    @Column(name = "ship_country") private String country;
    @Column(name = "ship_phone") private String phone;

    protected ShippingAddress() {}

    public static ShippingAddress of(Address a) {
        ShippingAddress s = new ShippingAddress();
        s.fullName = a.getFullName();
        s.line1 = a.getLine1();
        s.line2 = a.getLine2();
        s.city = a.getCity();
        s.state = a.getState();
        s.postalCode = a.getPostalCode();
        s.country = a.getCountry();
        s.phone = a.getPhone();
        return s;
    }

    public String getFullName() { return fullName; }
    public String getLine1() { return line1; }
    public String getLine2() { return line2; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public String getPostalCode() { return postalCode; }
    public String getCountry() { return country; }
    public String getPhone() { return phone; }
}

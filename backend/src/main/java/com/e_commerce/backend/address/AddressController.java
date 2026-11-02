package com.e_commerce.backend.address;

import com.e_commerce.backend.common.ApiException;
import com.e_commerce.backend.security.AuthUser;
import com.e_commerce.backend.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Address book ("Your Addresses"). The first address added becomes the default. */
@RestController
@RequestMapping("/api/addresses")
@Transactional
public class AddressController {

    public record AddressRequest(@NotBlank(message = "Enter a full name") @Size(max = 100) String fullName,
                                 @NotBlank(message = "Enter an address") @Size(max = 200) String line1,
                                 @Size(max = 200) String line2,
                                 @NotBlank(message = "Enter a city") @Size(max = 100) String city,
                                 @Size(max = 100) String state,
                                 @NotBlank(message = "Enter a ZIP / postal code") @Size(max = 20) String postalCode,
                                 @NotBlank(message = "Choose a country") @Size(max = 100) String country,
                                 @Size(max = 30) String phone,
                                 boolean makeDefault) {}

    public record AddressDto(Long id, String fullName, String line1, String line2, String city, String state,
                             String postalCode, String country, String phone, boolean isDefault) {
        static AddressDto from(Address a) {
            return new AddressDto(a.getId(), a.getFullName(), a.getLine1(), a.getLine2(), a.getCity(), a.getState(),
                    a.getPostalCode(), a.getCountry(), a.getPhone(), a.isDefaultAddress());
        }
    }

    private final AddressRepository addresses;
    private final UserRepository users;

    public AddressController(AddressRepository addresses, UserRepository users) {
        this.addresses = addresses;
        this.users = users;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<AddressDto> list(@AuthenticationPrincipal AuthUser me) {
        return addresses.findByUserIdOrderByDefaultAddressDescIdAsc(me.id()).stream().map(AddressDto::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressDto create(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody AddressRequest req) {
        if (addresses.countByUserId(me.id()) >= 20) {
            throw ApiException.badRequest("You can save up to 20 addresses");
        }
        Address address = new Address(users.getReferenceById(me.id()));
        apply(address, req);
        boolean first = addresses.countByUserId(me.id()) == 0;
        address = addresses.save(address);
        if (first || req.makeDefault()) {
            makeDefault(me.id(), address);
        }
        return AddressDto.from(address);
    }

    @PutMapping("/{id}")
    public AddressDto update(@AuthenticationPrincipal AuthUser me, @PathVariable Long id, @Valid @RequestBody AddressRequest req) {
        Address address = find(me, id);
        apply(address, req);
        if (req.makeDefault()) {
            makeDefault(me.id(), address);
        }
        return AddressDto.from(address);
    }

    @PostMapping("/{id}/default")
    public AddressDto setDefault(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        Address address = find(me, id);
        makeDefault(me.id(), address);
        return AddressDto.from(address);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        Address address = find(me, id);
        boolean wasDefault = address.isDefaultAddress();
        addresses.delete(address);
        addresses.flush();
        if (wasDefault) {
            addresses.findByUserIdOrderByDefaultAddressDescIdAsc(me.id()).stream().findFirst()
                    .ifPresent(a -> a.setDefaultAddress(true));
        }
    }

    private Address find(AuthUser me, Long id) {
        return addresses.findByIdAndUserId(id, me.id()).orElseThrow(() -> ApiException.notFound("Address"));
    }

    private void makeDefault(Long userId, Address target) {
        addresses.findByUserIdOrderByDefaultAddressDescIdAsc(userId)
                .forEach(a -> a.setDefaultAddress(a.getId().equals(target.getId())));
    }

    private static void apply(Address a, AddressRequest r) {
        a.setFullName(r.fullName().trim());
        a.setLine1(r.line1().trim());
        a.setLine2(blankToNull(r.line2()));
        a.setCity(r.city().trim());
        a.setState(blankToNull(r.state()));
        a.setPostalCode(r.postalCode().trim());
        a.setCountry(r.country().trim());
        a.setPhone(blankToNull(r.phone()));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}

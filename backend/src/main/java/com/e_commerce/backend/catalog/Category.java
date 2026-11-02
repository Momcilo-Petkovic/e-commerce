package com.e_commerce.backend.catalog;

import jakarta.persistence.*;

/**
 * A product category (e.g. "Smartphones"). Categories are grouped into departments
 * (e.g. "Electronics"), which drive the department menu and search filters.
 */
@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String departmentSlug;

    protected Category() {}

    public Category(String slug, String name, String department, String departmentSlug) {
        this.slug = slug;
        this.name = name;
        this.department = department;
        this.departmentSlug = departmentSlug;
    }

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public String getDepartment() { return department; }
    public String getDepartmentSlug() { return departmentSlug; }
}

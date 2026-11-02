package com.e_commerce.backend.wheel;

import jakarta.persistence.*;

/**
 * One slice of the Wheel of Fortune. {@code weight} controls the probability of landing on it:
 * P(segment) = weight / sum(all weights). Configurable by admins.
 */
@Entity
@Table(name = "wheel_segments")
public class WheelSegment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RewardType type;

    /** Percentage for PERCENT_OFF; ignored for other types. */
    @Column(nullable = false)
    private int value;

    @Column(nullable = false)
    private int weight;

    @Column(nullable = false)
    private String color;

    @Column(nullable = false)
    private int position;

    protected WheelSegment() {}

    public WheelSegment(String label, RewardType type, int value, int weight, String color, int position) {
        this.label = label;
        this.type = type;
        this.value = value;
        this.weight = weight;
        this.color = color;
        this.position = position;
    }

    public Long getId() { return id; }
    public String getLabel() { return label; }
    public RewardType getType() { return type; }
    public int getValue() { return value; }
    public int getWeight() { return weight; }
    public String getColor() { return color; }
    public int getPosition() { return position; }
}

package com.freetime.dto;

import java.util.Set;

public class UpdateProfileRequest {
    private String displayName;
    private String city;
    private String profilePictureUrl;
    private Set<String> interests;

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }
    public Set<String> getInterests() { return interests; }
    public void setInterests(Set<String> interests) { this.interests = interests; }
}
package com.freetime.dto;

public class CreateEventRequest {
    private String title;
    private String description;
    private String category;
    private String startTime;
    private String endTime;
    private String address;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
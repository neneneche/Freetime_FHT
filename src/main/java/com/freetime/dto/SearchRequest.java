package com.freetime.dto;

public class SearchRequest {
    private String query;
    private String reason;
    private String targetType;
    private Long targetId;

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
}
package com.samagri.dto;

public class AdminStatsDto {

    private long totalUsers;
    private long totalFarmers;
    private long totalFields;
    private long totalCrops;
    private long totalMonitoringRecords;
    private long activeAlerts;

    public AdminStatsDto() {
    }

    public AdminStatsDto(long totalUsers, long totalFarmers, long totalFields, long totalCrops, long totalMonitoringRecords, long activeAlerts) {
        this.totalUsers = totalUsers;
        this.totalFarmers = totalFarmers;
        this.totalFields = totalFields;
        this.totalCrops = totalCrops;
        this.totalMonitoringRecords = totalMonitoringRecords;
        this.activeAlerts = activeAlerts;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalFarmers() {
        return totalFarmers;
    }

    public void setTotalFarmers(long totalFarmers) {
        this.totalFarmers = totalFarmers;
    }

    public long getTotalFields() {
        return totalFields;
    }

    public void setTotalFields(long totalFields) {
        this.totalFields = totalFields;
    }

    public long getTotalCrops() {
        return totalCrops;
    }

    public void setTotalCrops(long totalCrops) {
        this.totalCrops = totalCrops;
    }

    public long getTotalMonitoringRecords() {
        return totalMonitoringRecords;
    }

    public void setTotalMonitoringRecords(long totalMonitoringRecords) {
        this.totalMonitoringRecords = totalMonitoringRecords;
    }

    public long getActiveAlerts() {
        return activeAlerts;
    }

    public void setActiveAlerts(long activeAlerts) {
        this.activeAlerts = activeAlerts;
    }
}

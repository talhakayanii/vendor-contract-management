CREATE DATABASE VendorContractManagement;
USE VendorContractManagement;
-- User Table
CREATE TABLE User (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('Vendor', 'Department') NOT NULL
);
-- Vendor Table
CREATE TABLE Vendor (
    VendorID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    ServiceCategory VARCHAR(100) NOT NULL,
    ComplianceCertifications TEXT,
    PerformanceRating FLOAT
);
-- Department Table
CREATE TABLE Department (
    DepartmentID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Budget DECIMAL(10, 2) NOT NULL,
    BudgetStatus ENUM('Within Budget', 'Exceeded Budget') NOT NULL
);
-- Contract Table
CREATE TABLE Contract (
    ContractID INT PRIMARY KEY AUTO_INCREMENT,
    CreatedBy INT NOT NULL,
    AssignedTo INT NOT NULL,
    Terms TEXT,
    Conditions TEXT,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    SpecialClauses TEXT,
    Status ENUM('Pending', 'Accepted', 'Rejected') NOT NULL
);
-- PurchaseOrder Table
CREATE TABLE PurchaseOrder (
    OrderID INT PRIMARY KEY AUTO_INCREMENT,
    VendorID INT NOT NULL,
    DepartmentID INT NOT NULL,
    ItemDetails TEXT NOT NULL,
    Quantity INT NOT NULL,
    TotalCost DECIMAL(10, 2) NOT NULL,
    OrderStatus ENUM('Created', 'Fulfilled', 'Cancelled') NOT NULL
);
-- VendorPerformance Table
CREATE TABLE VendorPerformance (
    PerformanceID INT PRIMARY KEY AUTO_INCREMENT,
    VendorID INT NOT NULL,
    Rating FLOAT NOT NULL,
    Feedback TEXT,
    Date DATE NOT NULL
);

-- Budget Table
CREATE TABLE Budget (
    BudgetID INT PRIMARY KEY AUTO_INCREMENT,
    DepartmentID INT NOT NULL,
    AllocatedAmount DECIMAL(10, 2) NOT NULL,
    SpentAmount DECIMAL(10, 2) NOT NULL,
    RemainingAmount DECIMAL(10, 2) NOT NULL
);
-- Task Table
CREATE TABLE Task (
    TaskID INT PRIMARY KEY AUTO_INCREMENT,
    AssignedTo INT NOT NULL,
    Description TEXT NOT NULL,
    Status ENUM('Pending', 'In Progress', 'Completed') NOT NULL
);
-- Notification Table
CREATE TABLE Notification (
    NotificationID INT PRIMARY KEY AUTO_INCREMENT,
    Message TEXT NOT NULL,
    SentTo INT NOT NULL,
    SentBy INT NOT NULL,
    Date DATETIME NOT NULL,
    Deadline DATE NOT NULL
);
ALTER TABLE Vendor
ADD CONSTRAINT FK_Vendor_User FOREIGN KEY (UserID) REFERENCES User(UserID);
ALTER TABLE Department
ADD CONSTRAINT FK_Department_User FOREIGN KEY (UserID) REFERENCES User(UserID);
ALTER TABLE Contract
ADD CONSTRAINT FK_Contract_Department FOREIGN KEY (CreatedBy) REFERENCES Department(DepartmentID),
ADD CONSTRAINT FK_Contract_Vendor FOREIGN KEY (AssignedTo) REFERENCES Vendor(VendorID);
ALTER TABLE PurchaseOrder
ADD CONSTRAINT FK_PurchaseOrder_Vendor FOREIGN KEY (VendorID) REFERENCES Vendor(VendorID),
ADD CONSTRAINT FK_PurchaseOrder_Department FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID);
ALTER TABLE VendorPerformance
ADD CONSTRAINT FK_VendorPerformance_Vendor FOREIGN KEY (VendorID) REFERENCES Vendor(VendorID);
ALTER TABLE Budget
ADD CONSTRAINT FK_Budget_Department FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID);
ALTER TABLE Task
ADD CONSTRAINT FK_Task_User FOREIGN KEY (AssignedTo) REFERENCES User(UserID);
ALTER TABLE Notification
ADD CONSTRAINT FK_Notification_SentTo FOREIGN KEY (SentTo) REFERENCES User(UserID),
ADD CONSTRAINT FK_Notification_SentBy FOREIGN KEY (SentBy) REFERENCES User(UserID);
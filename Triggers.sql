
DELIMITER $$

CREATE TRIGGER UpdateBudgetAfterPurchaseOrder
AFTER INSERT ON PurchaseOrder
FOR EACH ROW
BEGIN
    DECLARE new_spent_amount DECIMAL(10, 2);

    SELECT SpentAmount + NEW.TotalCost INTO new_spent_amount
    FROM Department
    WHERE DepartmentID = NEW.DepartmentID;

    UPDATE Department
    SET 
        SpentAmount = new_spent_amount,
        RemainingAmount = Budget - new_spent_amount,
        BudgetStatus = IF(new_spent_amount > Budget, 'Exceeded Budget', 'Within Budget')
    WHERE DepartmentID = NEW.DepartmentID;
END$$

DELIMITER ;


DELIMITER $$

CREATE TRIGGER after_vendor_performance_insert
AFTER INSERT ON VendorPerformance
FOR EACH ROW
BEGIN
    UPDATE Vendor
    SET PerformanceRating = NEW.Rating
    WHERE VendorID = NEW.VendorID;
END $$

DELIMITER ;



DELIMITER $$

CREATE TRIGGER UpdateBudgetStatus
BEFORE UPDATE ON Department
FOR EACH ROW
BEGIN
    -- Update RemainingAmount
    SET NEW.RemainingAmount = NEW.Budget - NEW.SpentAmount;

    -- Check if budget is exceeded or within budget
    IF NEW.Budget < NEW.SpentAmount THEN
        SET NEW.BudgetStatus = 'Exceeded Budget';
    ELSE
        SET NEW.BudgetStatus = 'Within Budget';
    END IF;
END $$

DELIMITER ;




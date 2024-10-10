-- Insert data into Tower
INSERT INTO Tower (Tower_Id, Tower_Name, Tower_Status) 
VALUES (1, 'Tower A', 'Active');

-- Insert data into Users
INSERT INTO Users (User_Id, User_Name, User_Password)
VALUES ('U001', 'John Doe', 'password123');

-- Insert data into Cards
INSERT INTO Cards (Card_Id, Kcc_Id, Card_Status, Acces_Status)
VALUES (1, 101, 'Active', 'Granted');

-- Insert data into Log 
INSERT INTO Log (Log_Id, Log_Time, Tower_Id, User_Id, Card_Id, Tower_Status, Card_Status, Acces_Status)
VALUES (1, GETDATE(), 1, 'U001', 1, 'Active', 'Active', 'Granted');



SELECT * FROM Tower;
SELECT * FROM Users;
SELECT * FROM Cards;
SELECT * FROM Log;

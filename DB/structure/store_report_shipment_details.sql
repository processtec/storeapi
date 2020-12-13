-- MySQL dump 10.13  Distrib 8.0.21, for macos10.15 (x86_64)
--
-- Host: localhost    Database: store
-- ------------------------------------------------------
-- Server version	8.0.21

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `report_shipment_details`
--

DROP TABLE IF EXISTS `report_shipment_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_shipment_details` (
  `idcartTx` int NOT NULL AUTO_INCREMENT,
  `idreport_shipment` int NOT NULL,
  `idstock` int DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `shippedQuantity` int NOT NULL DEFAULT '0',
  `backOrderQuantity` int NOT NULL DEFAULT '0',
  `status` int NOT NULL DEFAULT '1',
  `comments` varchar(500) DEFAULT NULL,
  `createdOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `idcmp` varchar(45) NOT NULL DEFAULT 'Component id from Leyla',
  `saleprice` decimal(8,2) NOT NULL DEFAULT '0.00',
  `costprice` decimal(8,2) DEFAULT '0.00',
  `cmpDescription` varchar(250) DEFAULT 'TODO Dual Acting Mechanical Seals',
  `cmpModel` varchar(250) DEFAULT 'TODO Mechanical Seal DAMS_VT104_NG (0)',
  PRIMARY KEY (`idcartTx`),
  UNIQUE KEY `idcartTx_UNIQUE` (`idcartTx`),
  KEY `fk_idreport_shipment_idx` (`idreport_shipment`),
  CONSTRAINT `fk_idreport_shipment` FOREIGN KEY (`idreport_shipment`) REFERENCES `report_shipment` (`idreport_shipment`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-12-13 11:28:59

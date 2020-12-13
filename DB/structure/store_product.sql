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
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `idproduct` int NOT NULL AUTO_INCREMENT,
  `idcmp` int NOT NULL,
  `idsupplier` int NOT NULL,
  `idvendor` int NOT NULL,
  `mpin` varchar(45) COLLATE utf8_unicode_ci NOT NULL,
  `serialno` varchar(45) COLLATE utf8_unicode_ci DEFAULT 'Use_idProduct',
  `idtag` varchar(100) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'optional',
  `status` int NOT NULL DEFAULT '1' COMMENT 'Ordered 0\\nisActive 1\\nSold 2\\nDamaged 3\\ntesting equipment 4\\nrepair/maintenance 5\\ntrials 6',
  `costprice` decimal(8,2) NOT NULL,
  `saleprice` decimal(8,2) NOT NULL DEFAULT '0.00',
  `idpo` varchar(45) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Purchase order\n',
  `idoc` varchar(45) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Order confirmation\n',
  `idstock` int NOT NULL,
  `idlocation` int NOT NULL,
  `supplier_company` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'TODO',
  `vendor_company` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'TODO',
  `createdOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastModifiedOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastModifiedBy` varchar(45) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'some user',
  `isActive` int NOT NULL DEFAULT '1',
  `mfgmodelnumber` varchar(250) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'TODO',
  `PurchaseOrderCode` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`idproduct`),
  UNIQUE KEY `idproduct_UNIQUE` (`idproduct`),
  KEY `idstock_idx` (`idstock`),
  KEY `fk_idlocation_idx` (`idlocation`),
  CONSTRAINT `fk_idlocation_product` FOREIGN KEY (`idlocation`) REFERENCES `location` (`idlocation`),
  CONSTRAINT `fk_idstock_product` FOREIGN KEY (`idstock`) REFERENCES `stock` (`idstock`)
) ENGINE=InnoDB AUTO_INCREMENT=8864 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-12-13 11:28:57

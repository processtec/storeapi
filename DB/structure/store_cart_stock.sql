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
-- Table structure for table `cart_stock`
--

DROP TABLE IF EXISTS `cart_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_stock` (
  `idcart_stock` int NOT NULL AUTO_INCREMENT,
  `idcart` int NOT NULL,
  `idstock` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `createdOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastModifiedOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `idUser` int NOT NULL DEFAULT '1',
  `isActive` int NOT NULL DEFAULT '1',
  `shippedQuantity` int NOT NULL DEFAULT '0',
  `backOrderQuantity` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`idcart_stock`),
  UNIQUE KEY `idcart_product_UNIQUE` (`idcart_stock`),
  UNIQUE KEY `unique_cart_stock` (`idcart`,`idstock`),
  KEY `fk_idcart_mn_idx` (`idcart`),
  KEY `fk_idstock_idx` (`idstock`),
  KEY `fk_userid_cart_stock_idx` (`idUser`),
  CONSTRAINT `fk_idcart_mn` FOREIGN KEY (`idcart`) REFERENCES `cart` (`idcart`),
  CONSTRAINT `fk_idstock` FOREIGN KEY (`idstock`) REFERENCES `stock` (`idstock`),
  CONSTRAINT `fk_userid_cart_stock` FOREIGN KEY (`idUser`) REFERENCES `user` (`idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-12-13 11:28:58

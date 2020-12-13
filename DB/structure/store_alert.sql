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
-- Table structure for table `alert`
--

DROP TABLE IF EXISTS `alert`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alert` (
  `idalert` int NOT NULL AUTO_INCREMENT,
  `type` int NOT NULL DEFAULT '1',
  `idUser` int NOT NULL,
  `userName` varchar(150) COLLATE utf8_unicode_ci NOT NULL,
  `message` varchar(6000) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Some message on what hapened',
  `lastModifiedOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isAlerted` int NOT NULL DEFAULT '0',
  `createdOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `description` varchar(500) COLLATE utf8_unicode_ci DEFAULT 'complete details',
  PRIMARY KEY (`idalert`),
  UNIQUE KEY `idalert_UNIQUE` (`idalert`),
  KEY `fk_idUser_alert_idx` (`idUser`),
  KEY `fk_username_alert_idx` (`userName`),
  CONSTRAINT `fk_idUser_alert` FOREIGN KEY (`idUser`) REFERENCES `user` (`idUser`),
  CONSTRAINT `fk_username_alert` FOREIGN KEY (`userName`) REFERENCES `user` (`userName`)
) ENGINE=InnoDB AUTO_INCREMENT=1326 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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

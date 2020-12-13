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
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `idUser` int NOT NULL AUTO_INCREMENT,
  `fname` varchar(45) COLLATE utf8_unicode_ci NOT NULL,
  `lname` varchar(45) COLLATE utf8_unicode_ci NOT NULL,
  `salt` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'No need',
  `digest` varchar(200) COLLATE utf8_unicode_ci NOT NULL,
  `auditId` varchar(45) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Need to think',
  `address1` varchar(45) COLLATE utf8_unicode_ci DEFAULT 'TODO',
  `address2` varchar(45) COLLATE utf8_unicode_ci DEFAULT 'TODO',
  `city` varchar(45) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Visalia',
  `zip` int NOT NULL DEFAULT '94532',
  `state` varchar(45) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'ca',
  `country` varchar(45) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'US',
  `email` varchar(150) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'a@b.com',
  `userName` varchar(150) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'adureg',
  `lastModifiedOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isActive` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`idUser`),
  UNIQUE KEY `idUser_UNIQUE` (`idUser`),
  UNIQUE KEY `lname_UNIQUE` (`lname`),
  UNIQUE KEY `fname_UNIQUE` (`fname`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  UNIQUE KEY `userName_UNIQUE` (`userName`)
) ENGINE=InnoDB AUTO_INCREMENT=100003 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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

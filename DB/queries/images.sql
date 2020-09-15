select distinct
  Comp.ComponentID,
  Comp.TaxonomyCode,
  Comp.CategoryCode,
  Comp.ManufacturerID,
  --Comp.UniversalProductCode,
  replace(Comp.UniversalProductCode, ' // ', '<br /><br />') as UniversalProductCode,
  --convert(bit, case when [EQListCount] > 0 or [EQListSubCount] >0 or [InventoryCount] > 0 or InventorySubCount > 0 then 1 else 0 end) as IsEquipmentListed,
  m.MfgModelNumber + ' (' + Cmp.ConcatModelConfigurationAbbreviations(Comp.ComponentID, 0) + ')' as MfgModelNumber,
  t.[Description] as CategoryDescription,
  manf.Symbol as ManufacturersSymbol,
  manf.CompanyName as CompanyName,
  dt.[Description] as DesignDescription,
  Comp.SizeDescription as Sizes,
  Comp.ConfigurationCode as [Configurations],
  Comp.MaterialDescription as Materials,
  Cmp.GetMinimumSizeForComponentID(Comp.ComponentID) as SortSize,
  Comp.ElastomerDescription as Elastomers,
  Comp.SubcomponentConfigurations,
  isnull(mpn.MfgPartNumber, '') as MfgPartNumber,
  cst.[Description] as ComponentStatus,
  Comp.ConfigurationKey,
  Comp.ComponentStatusTypeID,
  Comp.Taxonomy,
  isNull(Img.[FileName], '') as URL,
  isNull(Img.ImageDescription, 'No Image Available') as ImageDescription


  --IsNull(eli.ComponentCount, 0) as EquipmentListCount
from
  Cmp.Components Comp

  left join (
    select
      ComponentID,
      MfgPartNumber
    from
      Cmp.MfgPartNumbers
    where
      [Priority] = 100
  ) mpn
  on (Comp.ComponentID = mpn.ComponentID)

  inner join Cmp.ComponentStatusTypes cst
  on (comp.ComponentStatusTypeID = cst.ComponentStatusTypeID)

  inner join Cmp.Manufacturers manf
  on (Comp.ManufacturerID = manf.ManufacturerID)

  inner join Cmp.DesignTypes dt
  on (Comp.DesignTypeID = dt.DesignTypeID)

  inner join Cmp.Taxonomy t
  on (Comp.CategoryCode = t.CategoryCode)

  inner join Cmp.Models m
  on (Comp.ModelID = m.ModelID)

  left join (
    select
      ed.EntityID as ComponentID,
      d.[FileName] as [FileName],
      d.[SummaryCaption] as ImageDescription
    from
      Cmp.EntityDocuments ed

      inner join Cmp.Documents d
      on (ed.DocumentID = d.DocumentID)
    where
      ed.IsSummaryDocument = 1

  ) img
  on (Comp.ComponentID = img.ComponentID)

  --left join (

  --	select distinct
  --		c.ComponentID,
  --		i.URL,
  --		case when i.ConfigurationID = 0 then t.[Description] else ch.[Description] end as ImageDescription
  --	from
  --		Cmp.Components c

  --		inner join Cmp.Taxonomy t
  --		on (c.CategoryCode = t.CategoryCode)

  --		inner join Cmp.ComponentConfigurations cc
  --		on (c.ComponentID = cc.ComponentID)

  --		inner join Cmp.ConfigurationChoices ch
  --		on (cc.ConfigurationID = ch.ConfigurationID)

  --		inner join Cmp.ConfigurationImages i
  --		on (
  --			c.TaxonomyCode like i.TaxonomyCode + '%' and
  --			(cc.ConfigurationID = i.ConfigurationID or i.ConfigurationID = 0)
  --		)
  --	where
  --		ImagePriority = 1

  --) img
  --on (Comp.ComponentID = img.ComponentID)

where
  Comp.ComponentID = @ComponentID

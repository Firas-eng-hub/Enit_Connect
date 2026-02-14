CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Students: per-column trigram indexes used by search endpoints.
CREATE INDEX IF NOT EXISTS students_firstname_trgm_idx ON students USING GIN (firstname gin_trgm_ops);
CREATE INDEX IF NOT EXISTS students_lastname_trgm_idx ON students USING GIN (lastname gin_trgm_ops);
CREATE INDEX IF NOT EXISTS students_email_trgm_idx ON students USING GIN (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS students_country_trgm_idx ON students USING GIN (country gin_trgm_ops);
CREATE INDEX IF NOT EXISTS students_city_trgm_idx ON students USING GIN (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS students_phone_trgm_idx ON students USING GIN (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS students_class_trgm_idx ON students USING GIN ("class" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS students_promotion_trgm_idx ON students USING GIN (promotion gin_trgm_ops);
CREATE INDEX IF NOT EXISTS students_type_trgm_idx ON students USING GIN (type gin_trgm_ops);

-- Students: wide-text index for concatenated browse search.
CREATE INDEX IF NOT EXISTS students_search_text_trgm_idx
  ON students
  USING GIN (
    (
      COALESCE(firstname, '') || ' ' ||
      COALESCE(lastname, '') || ' ' ||
      COALESCE(email, '') || ' ' ||
      COALESCE(country, '') || ' ' ||
      COALESCE(city, '') || ' ' ||
      COALESCE(phone, '') || ' ' ||
      COALESCE("class", '') || ' ' ||
      COALESCE(promotion, '') || ' ' ||
      COALESCE(type, '')
    ) gin_trgm_ops
  );

-- Companies: per-column trigram indexes used by search endpoints.
CREATE INDEX IF NOT EXISTS companies_name_trgm_idx ON companies USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS companies_email_trgm_idx ON companies USING GIN (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS companies_country_trgm_idx ON companies USING GIN (country gin_trgm_ops);
CREATE INDEX IF NOT EXISTS companies_city_trgm_idx ON companies USING GIN (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS companies_address_trgm_idx ON companies USING GIN (address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS companies_phone_trgm_idx ON companies USING GIN (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS companies_website_trgm_idx ON companies USING GIN (website gin_trgm_ops);

-- Companies: wide-text index for concatenated browse search.
CREATE INDEX IF NOT EXISTS companies_search_text_trgm_idx
  ON companies
  USING GIN (
    (
      COALESCE(name, '') || ' ' ||
      COALESCE(email, '') || ' ' ||
      COALESCE(website, '') || ' ' ||
      COALESCE(country, '') || ' ' ||
      COALESCE(city, '') || ' ' ||
      COALESCE(phone, '') || ' ' ||
      COALESCE(address, '')
    ) gin_trgm_ops
  );

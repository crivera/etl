-- Policies for etl_document
CREATE POLICY "Authenticated users can view their own documents"
ON public.etl_document
FOR SELECT
TO authenticated
USING (user_id = (select id from public.etl_user where external_id = auth.uid()));

CREATE POLICY "Authenticated users can insert documents"
ON public.etl_document
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update their own documents"
ON public.etl_document
FOR UPDATE
TO authenticated
USING (user_id = (select id from public.etl_user where external_id = auth.uid()))
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete their own documents"
ON public.etl_document
FOR DELETE
TO authenticated
USING (user_id = (select id from public.etl_user where external_id = auth.uid()));

-- Policies for etl_document_collection
CREATE POLICY "Authenticated users can view their own document collections"
ON public.etl_document_collection
FOR SELECT
TO authenticated
USING (user_id = (select id from public.etl_user where external_id = auth.uid()));

CREATE POLICY "Authenticated users can insert document collections"
ON public.etl_document_collection
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update their own document collections"
ON public.etl_document_collection
FOR UPDATE
TO authenticated
USING (user_id = (select id from public.etl_user where external_id = auth.uid()))
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete their own document collections"
ON public.etl_document_collection
FOR DELETE
TO authenticated
USING (user_id = (select id from public.etl_user where external_id = auth.uid()));

-- Policies for etl_document_extractions
CREATE POLICY "Authenticated users can view their own document extractions"
ON public.etl_document_extractions
FOR SELECT
TO authenticated
USING (true); -- Assuming all users can view extractions

CREATE POLICY "Authenticated users can insert document extractions"
ON public.etl_document_extractions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update document extractions"
ON public.etl_document_extractions
FOR UPDATE
TO authenticated
WITH CHECK (true); -- Assuming all users can update extractions

CREATE POLICY "Authenticated users can delete document extractions"
ON public.etl_document_extractions
FOR DELETE
TO authenticated
WITH CHECK (true); -- Assuming all users can delete extractions

-- Policies for etl_field_groups
CREATE POLICY "Authenticated users can view their own field groups"
ON public.etl_field_groups
FOR SELECT
TO authenticated
USING (user_id = (select id from public.etl_user where external_id = auth.uid()));

CREATE POLICY "Authenticated users can insert field groups"
ON public.etl_field_groups
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update their own field groups"
ON public.etl_field_groups
FOR UPDATE
TO authenticated
USING (user_id = (select id from public.etl_user where external_id = auth.uid()))
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete their own field groups"
ON public.etl_field_groups
FOR DELETE
TO authenticated
USING (user_id = (select id from public.etl_user where external_id = auth.uid()));

-- Policies for etl_templates
CREATE POLICY "Authenticated users can view their own templates"
ON public.etl_templates
FOR SELECT
TO authenticated
USING (user_id = (select id from public.etl_user where external_id = auth.uid()));

CREATE POLICY "Authenticated users can insert templates"
ON public.etl_templates
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update their own templates"
ON public.etl_templates
FOR UPDATE
TO authenticated
USING (user_id = (select id from public.etl_user where external_id = auth.uid()))
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete their own templates"
ON public.etl_templates
FOR DELETE
TO authenticated
USING (user_id = (select id from public.etl_user where external_id = auth.uid()));
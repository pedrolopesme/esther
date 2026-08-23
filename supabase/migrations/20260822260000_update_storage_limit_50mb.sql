-- Update bucket file_size_limit to 50MB (52428800 bytes)
update storage.buckets
set file_size_limit = 52428800
where id = 'study-materials';

CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete messages"
ON public.messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
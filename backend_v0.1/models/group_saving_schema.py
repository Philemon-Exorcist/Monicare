
"""
asyn def create_group_saving(payload: GroupSavingCreateSchema):

    #Creates a new group saving record in the database.

    supabase_admin = get_supabase_admin()

    try:
        # Insert the new group saving record into the "group_savings" table
        response = supabase_admin.table("group_savings").insert({
            "group_name": payload.group_name,
            "target_amount": payload.target_amount,
            "contribution_amount": payload.contribution_amount,
            "contribution_frequency": payload.contribution_frequency,
            "start_date": payload.start_date,
            "end_date": payload.end_date,
            "created_by": payload.created_by
        }).execute()

        if response.status_code == 201:
            return {
                "status": "success",
                "message": "Group saving created successfully.",
                "data": response.data
            }
        else:
            return {
                "status": "error",
                "message": f"Failed to create group saving: {response.error_message}"
            }

    except Exception as e:
        logger.error(f"Error creating group saving: {e}")
        return {
            "status": "error",
            "message": f"An error occurred while creating group saving: {str(e)}"
        }
"""
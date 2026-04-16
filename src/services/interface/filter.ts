export interface PropertyFilter {
    search?:string;
    name?: string;
    location?: string;
    property_status?: string;
    owner_id?: string;
    sort_by?:string;
    sort_order?:string;
    start_date?: string;
    end_date?: string;
    size?: number;
    page?: number;
  }
  
  export interface UserFilter {
    search?:string;
    // first_name?: string;
    // last_name?: string;
    // email?: string;
    // creator_id?: string;
    // phone_number?: string;
    // role?: string;
    // start_date?: string;
    // end_date?: string;
    // size?: number;
    // page?: number;
  }
  
  export interface NoticeAgreementFilter {
  notice_type?: string;
  effective_date?: string;
  property_id?: string;
  tenant_id?: string;
  start_date?: string;
  end_date?: string;
  sort_by?:string;
  sort_order?:string;
  size?: number;
  page?: number;
}
package com.weisong.backend.mapper;
import org.apache.ibatis.annotations.*;
import com.weisong.backend.entities.Employee;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;


/**
 * @author 李伟松
 * @create 2022-02-16-21:17
 */
@Mapper
@Repository
public interface EmployeeMapper {

    @Select("select `emp_id`,`lastName`,`email`,`gender`, `departmentName` ,`birth` from employee")
    public List<Employee> getAllEmp();

    @Insert("insert into employee(lastName,email,gender,departmentName,birth) values(#{lastName},#{email},#{gender},#{departmentName},#{birth})")
    public Long insertEmp(String lastName, String email , Integer gender, String departmentName, Date birth);


    @Delete("delete from employee where emp_id=#{emp_id}")
    public void deleteEmpById(Integer emp_id);



}

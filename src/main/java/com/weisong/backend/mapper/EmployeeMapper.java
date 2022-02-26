package com.weisong.backend.mapper;
import com.github.pagehelper.PageInfo;
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

    @Select("select `emp_Id`,`name`,`email`,`gender`, `departmentName` ,`birth` ,`enableEnum` from employee")
    public List<Employee> getAllEmp();

    @Select("select `emp_Id`,`name`,`email`,`gender`, `departmentName` ,`birth` ,`enableEnum` from employee")
    public List<Employee> employeePageList();

    @Select("select `enableEnum` from employee where emp_Id=#{emp_Id}")
    public Integer getEnableById(@Param("emp_Id")Integer emp_Id);

    @Insert("insert into employee(name,email,gender,departmentName,birth,enableEnum) values(#{name}, #{email},#{gender},#{departmentName},#{birth},#{enableEnum})")
    public void insertEmp(@Param("lastName")String name, @Param("email")String email , @Param("gender")Integer gender, @Param("departmentName")String departmentName, @Param("birth")Date birth, @Param("enableEnum")Integer enableEnum);

    @Delete("delete from employee where emp_Id=#{emp_Id}")
    public void deleteEmpById(@Param("emp_Id")Integer emp_Id);

    @Update("update employee set enableEnum = #{enableEnum} where emp_Id = #{emp_Id}")
    public Boolean changeEnableById(@Param("emp_Id")Integer emp_Id,@Param("enableEnum")Integer enableEnum);

    @Select("SELECT name,COUNT(name) from employee GROUP BY name HAVING COUNT(name) > 1")
//    select lastName from employee where lastName in( select lastName from employee group by lastName having count(*) > 1) order by lastName
    public List<Employee> checkUser(String name);


}

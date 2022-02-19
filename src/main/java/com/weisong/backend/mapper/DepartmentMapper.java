package com.weisong.backend.mapper;

import com.weisong.backend.entities.Department;
import com.weisong.backend.entities.Employee;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-17-19:04
 */
@Mapper
@Repository
public interface DepartmentMapper {

    @Select("select * from department")
    public List<Department> getAllDept();

    @Insert("insert into department(departmentName) values(#{departmentName})")
    public Long insertDept(String departmentName);

}
